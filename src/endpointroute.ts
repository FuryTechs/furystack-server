import * as BodyParser from 'body-parser';
import * as Express from 'express';
import { CollectionResult, CustomAction, EndpointBuilder,
    EndpointEntitySet, ModelDescriptorStore, ODataQuery } from 'furystack-core';
import { DataProviderBase } from './';
import { ServerActionOwnerAbstract, ServerEntitySet, ServerEntityType } from './ServerScoped';

// tslint:disable-next-line:no-unused-expression
type requestHandler = (entitySet: ServerEntitySet<any, any>,
                       dataProvider: DataProviderBase<any, any>,
                       req: Express.Request,
                       resp: Express.Response) => void;

export class EndpointRoute extends ServerActionOwnerAbstract {
    protected getActionByName<TBody, TReturns>(name: string): CustomAction<TBody, TReturns> {
        return this.EndpointBuilder.CustomAction(name) as CustomAction<TBody, TReturns>;
    }

    public EntitySet<T, K = any>(entityTypeClass: { new (): T },
                                 entitySetName: string): ServerEntitySet<T, K> {
        return this.entitySets.find((s) => s.Name === entitySetName);
    }

    public EntityType<T>(entityTypeClass: {new(): T}): ServerEntityType {
        const entityTypeName = ModelDescriptorStore.GetName(entityTypeClass);
        return this.entityTypes.find((t) => t.Name === entityTypeName);
    }

    private dataProviderRefs: Array<DataProviderBase<any, any>> = [];

    private readonly entitySets: Array<ServerEntitySet<any, any>>;
    private readonly entityTypes: ServerEntityType[];

    /**
     * Returns the $metadata response body
     */
    public GetMetadataBody(): string {
        // ToDo: Figure out if it is possible to create a standard OData V4 $metadata XML
        return JSON.stringify(this.EndpointBuilder);
    }

    /**
     * Sets a Data Provider instance to a specified Entity Set
     * @param {DataProviderBase<any, any>} dataProvider The DataProvider instance to be set
     * @param {string} entitySetName The name of the specified EntitySet
     */
    public setDataProviderForEntitySet(dataProvider: DataProviderBase<any, any>, entitySetName: string) {
        this.dataProviderRefs[entitySetName] = dataProvider;
    }

    /**
     * Gets the current provider to the entitySet
     * @param {string} entitySetName The name of the entity set
     * @returns {DataProviderBase} The Data Provider if set, undefined othervise
     */
    public getDataProviderForEntitySet(entitySetName: string): DataProviderBase<any, any> {
        const dp = this.dataProviderRefs[entitySetName];
        if (!dp) {
            throw new Error(`No DataProvider specified for entitySet '${entitySetName}'`);
        }
        return dp;
    }

    private router: Express.Router = Express.Router();

    public static GetEntityIdFromPath(path: string): number | string {
        const entityId: string = path           // entitySet(123)
            .match(/\([0-9a-zA-Z']{1,}\)/g)[0]  // (123)
            .match(/[0-9a-zA-Z]/g).join('');    // 123
        if (!Number(entityId)) {
            return entityId;
        }
        return parseInt(entityId.toString(), 0);

    }

    private async handleGetCollection(entitySet: ServerEntitySet<any, any>,
                                      dbProvider: DataProviderBase<any, any>,
                                      req: Express.Request,
                                      resp: Express.Response) {

        const odataParams = req.query;
        const query = new ODataQuery<any, string>();

        // tslint:disable:no-string-literal
        query.Top = odataParams['$top'];
        query.Skip = odataParams['$skip'];
        query.OrderBy = odataParams['$orderby'];

        const collection = await dbProvider.GetCollectionAsync(query);
        resp.status(200).send(collection);
        // ToDo: Check if this is a custom action
    }

    private async handleGetSingleEntity(entitySet: ServerEntitySet<any, any>,
                                        dbProvider: DataProviderBase<any, any>,
                                        req: Express.Request,
                                        resp: Express.Response) {
        // ToDo: Check if req is custom function
        const odataParams = req.query;
        const id = EndpointRoute.GetEntityIdFromPath(req.path);
        const entity = await dbProvider.GetSingleAsync(id);
        if (entity) {
            resp.status(200)
                .send(entity);
        } else {
            resp.status(404)
                .send({});
        }

    }

    private async handlePost(entitySet: ServerEntitySet<any, any>,
                             dbProvider: DataProviderBase<any, any>,
                             req: Express.Request,
                             resp: Express.Response) {
        // ToDo: check if req is custom action
        const created = await dbProvider.PostAsync(req.body);
        resp.status(200).send(created);
    }

    private async handlePut(entitySet: ServerEntitySet<any, any>,
                            dbProvider: DataProviderBase<any, any>,
                            req: Express.Request,
                            resp: Express.Response) {
        const id = EndpointRoute.GetEntityIdFromPath(req.path);
        const result = await dbProvider.PutAsync(id, req.body);
        resp.status(200).send(result);
    }

    private async handlePatch(entitySet: ServerEntitySet<any, any>,
                              dbProvider: DataProviderBase<any, any>,
                              req: Express.Request,
                              resp: Express.Response) {

        const id = EndpointRoute.GetEntityIdFromPath(req.path);
        const entity = await dbProvider.GetSingleAsync(id);
        const result = await dbProvider.PatchAsync(id, req.body);
        resp.status(200)
            .send(result);
    }

    private async handleDelete(entitySet: ServerEntitySet<any, any>,
                               dbProvider: DataProviderBase<any, any>,
                               req: Express.Request,
                               resp: Express.Response) {
        const id = EndpointRoute.GetEntityIdFromPath(req.path);
        const result = await dbProvider.Delete(id);
        resp.status(204).send({});
    }

    private async handleWrapper(handler: requestHandler,
                                entitySet: ServerEntitySet<any, any>, req: Express.Request, resp: Express.Response) {
        try {
            const dbProvider = this.getDataProviderForEntitySet(entitySet.Name);
            await handler(entitySet, dbProvider, req, resp);
        } catch (error) {
            resp.status(500)
                .send({
                    error: {
                        message: error.message,
                    },
                });
        }
    }

    private registerCollections() {
        this.entitySets.forEach((entitySet) => {
            this.router.get([`/${entitySet.Name}`, `/${entitySet.Name}/*`], async (req, resp) =>
                this.handleWrapper(this.handleGetCollection, entitySet, req, resp));

            this.router.get(`/${entitySet.Name}(*)*`, async (req, resp) =>
                this.handleWrapper(this.handleGetSingleEntity, entitySet, req, resp));

            this.router.post(`/${entitySet.Name}*`, async (req, resp) =>
                this.handleWrapper(this.handlePost, entitySet, req, resp));

            this.router.put(`/${entitySet.Name}(*)`, async (req, resp) =>
                this.handleWrapper(this.handlePut, entitySet, req, resp));

            this.router.patch(`/${entitySet.Name}(*)`, async (req, resp) =>
                this.handleWrapper(this.handlePatch, entitySet, req, resp));

            this.router.delete(`/${entitySet.Name}(*)`, async (req, resp) =>
                this.handleWrapper(this.handleDelete, entitySet, req, resp));
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
     * @constructs EndpointRoute
     */
    constructor(expressAppRef: Express.Application, protected EndpointBuilder: EndpointBuilder) {
        super();
        this.entitySets = EndpointBuilder.GetAllEntitySets().map((s) =>
            new ServerEntitySet(s,
                s.EndpointEntityType.ModelDescriptor.Object,
                // tslint:disable-next-line:max-line-length
                s.EndpointEntityType.ModelDescriptor.Object[s.EndpointEntityType.ModelDescriptor.PrimaryKey.PrimaryKey] ));
        this.entityTypes = EndpointBuilder.GetAllEntityTypes().map((s) => new ServerEntityType(s));
        expressAppRef.use(BodyParser.json());
        this.registerExpressRoute(expressAppRef);
    }
}
