import * as Express from 'express';
import { EndpointBuilder, ODataQuery } from 'furystack-core';
import { DataProviderBase } from './';

export class EndpointRoute {

    private dataProviderRefs: Array<DataProviderBase<any, any>> = [];

    /**
     * Returns the $metadata response body
     */
    public GetMetadataBody(): string {
        return JSON.stringify(this.EndpointBuilder);
    }

    public setDataProviderForEntitySet(dataProvider: DataProviderBase<any, any>, entitySetName: string) {
        this.dataProviderRefs[entitySetName] = dataProvider;
    }

    public getDataProviderForEntitySet(entitySetName: string): DataProviderBase<any, any> {
        return this.dataProviderRefs[entitySetName];
    }

    private router: Express.Router = Express.Router();

    private async getEntityFromProviderAsync(providerName: string, entityId: string | number) {
                const dataProvider = this.getDataProviderForEntitySet(providerName);
                let entity = null;
                if (!Number(entityId)) {
                    entity = await dataProvider.GetSingleAsync(entityId) ;
                } else {
                    entity = await dataProvider.GetSingleAsync(parseInt(entityId.toString(), 0));
                }

                return entity;
    }

    private registerCollections() {
        this.EndpointBuilder.GetAllEntitySets().forEach((entitySet) => {
            /** GET Collection */
            this.router.get(`/${entitySet.Name}`, async (req, resp) => {
                const odataParams = req.query;
                const query = new ODataQuery<any, string>();

                // tslint:disable:no-string-literal
                query.Top = odataParams['$top'];
                query.Skip = odataParams['$skip'];
                query.OrderBy = odataParams['$orderby'];

                const collection = await this.getDataProviderForEntitySet(entitySet.Name).GetCollectionAsync(query);
                resp.status(200)
                    .send(collection);
            });

            /** GET single Entity */
            this.router.get(`/${entitySet.Name}(*)*`, async (req, resp) => {
                const odataParams = req.query;
                const entityId: string = req.path                               // entitySet(123)
                                    .match(/\([0-9a-zA-Z']{1,}\)/g)[0] // (123)
                                    .match(/[0-9a-zA-Z]/g).join(''); // 123
                const entity = await this.getEntityFromProviderAsync(entitySet.Name, entityId);
                if (entity) {
                    resp.status(200)
                        .send(entity);
                } else {
                    resp.status(404)
                        .send();
                }
            });

            this.router.post(`/${entitySet.Name}`, (req, resp) => {
                // ToDo: Create entity in store, return created
                resp.status(200)
                    .send(['post', entitySet]);
            });

            this.router.put(`/${entitySet.Name}`, (req, resp) => {
                // ToDo: put entity to store, return modified
                resp.status(200)
                    .send(['post', entitySet]);
            });

            this.router.patch(`/${entitySet.Name}`, (req, resp) => {
                // ToDo: patch entity in store, return modified
                resp.status(200)
                    .send(['post', entitySet]);
            });

            this.router.delete(`/${entitySet.Name}`, (req, resp) => {
                // ToDo: remove entity from store
                resp.status(204)
                    .send(['post', entitySet]);
            });
        });
    }

    private registerExpressRoute(expressAppRef: Express.Application) {

        this.router.get('/([\$])metadata', (req, resp) => {
            resp
                // .set("Content-Type", "text/xml")
                .status(200)
                .send(this.GetMetadataBody());
        });

        this.registerCollections();

        expressAppRef.use(`/${this.EndpointBuilder.NameSpaceRoot}`, this.router);

    }

    /**
     * Constructs an OData endpoint from the specified models
     * and registers it to an Express application to a specific route
     * @param expressAppRef The Express application reference to register the OData Endpoint
     * @param route The root for the OData endpoint (e.g. 'odata.svc')
     * @param ModelBuilder The OData modelbuilder which defines what entities will be registered into the endpoint
     */
    constructor(expressAppRef: Express.Application, private EndpointBuilder: EndpointBuilder) {
        this.registerExpressRoute(expressAppRef);
    }
}
