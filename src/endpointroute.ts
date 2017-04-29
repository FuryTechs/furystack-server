import * as Express from 'express';
import { CollectionResult, EndpointBuilder, ODataQuery } from 'furystack-core';
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

    private getEntityIdFromPath(path: string): number | string {
        const entityId: string = path                               // entitySet(123)
            .match(/\([0-9a-zA-Z']{1,}\)/g)[0] // (123)
            .match(/[0-9a-zA-Z]/g).join(''); // 123
        if (!Number(entityId)) {
            return entityId;
        }
        return parseInt(entityId.toString(), 0);

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
                resp.send(200, collection);
            });

            /** GET single Entity */
            this.router.get(`/${entitySet.Name}(*)*`, async (req, resp) => {
                // ToDO: Check if req is custom function
                const odataParams = req.query;
                const id = this.getEntityIdFromPath(req.path);
                const entity = await this.getDataProviderForEntitySet(entitySet.Name).GetSingleAsync(id);
                if (entity) {
                    resp.send(200, entity);
                } else {
                    resp.send(404);
                }
            });

            this.router.post(`/${entitySet.Name}*`, async (req, resp) => {
                // ToDo: Create entity in store, return created
                // ToDo: check if req is custom action
                const provider = this.getDataProviderForEntitySet(entitySet.Name);
                try {
                    const created = await provider.PostAsync(req.body);
                    resp.send(200, created);
                } catch (error) {
                    resp.send(500, {
                        error: {
                            message: error.message,
                        },
                    });
                }
            });

            this.router.put(`/${entitySet.Name}(*)`, async (req, resp) => {
                // ToDo: put entity to store, return modified
                const id = this.getEntityIdFromPath(req.path);
                const entity = await this.getDataProviderForEntitySet(entitySet.Name).GetSingleAsync(id);
                const result = await this.getDataProviderForEntitySet(entitySet.Name).PutAsync(id, req.body);
                resp.send(200, ['put', result]);
            });

            this.router.patch(`/${entitySet.Name}(*)`, async (req, resp) => {
                // ToDo: patch entity in store, return modified
                const id = this.getEntityIdFromPath(req.path);
                const entity = await this.getDataProviderForEntitySet(entitySet.Name).GetSingleAsync(id);
                const result = await this.getDataProviderForEntitySet(entitySet.Name).PatchAsync(id, req.body);
                resp.send(200, ['patch', result]);
            });

            this.router.delete(`/${entitySet.Name}(*)`, async (req, resp) => {
                // ToDo: remove entity from store
                const id = this.getEntityIdFromPath(req.path);
                const result = await this.getDataProviderForEntitySet(entitySet.Name).Delete(id);
                resp.send(204, {});
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
