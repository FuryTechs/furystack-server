import * as BodyParser from 'body-parser';
import * as Express from 'express';
import { CollectionResult, CustomAction, EndpointBuilder,
    EndpointEntitySet, ModelDescriptorStore, ODataQuery } from 'furystack-core';
import { ServerActionOwnerAbstract, ServerCustomAction, ServerEntitySet, ServerEntityType } from './ServerScoped';

// tslint:disable-next-line:no-unused-expression
type requestHandler = (entitySet: ServerEntitySet<any, any>,
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
    private readonly entitySets: Array<ServerEntitySet<any, any>>;
    private readonly entityTypes: ServerEntityType[];

    /**
     * Returns the $metadata response body
     */
    public GetMetadataBody(): string {
        // ToDo: Figure out if it is possible to create a standard OData V4 $metadata XML
        return JSON.stringify(this.EndpointBuilder);
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
                                      req: Express.Request,
                                      resp: Express.Response) {

        const odataParams = req.query;
        const query = new ODataQuery<any, string>();

        // tslint:disable:no-string-literal
        query.Top = odataParams['$top'];
        query.Skip = odataParams['$skip'];
        query.OrderBy = odataParams['$orderby'];

        const collection = await entitySet.DataProvider.GetCollectionAsync(query);
        resp.status(200).send(collection);
        // ToDo: Check if this is a custom action
    }

    private async handleGetSingleEntity(entitySet: ServerEntitySet<any, any>,
                                        req: Express.Request,
                                        resp: Express.Response) {
        const odataParams = req.query;
        const id = EndpointRoute.GetEntityIdFromPath(req.path);
        const entity = await entitySet.DataProvider.GetSingleAsync(id);
        if (entity) {
            resp.status(200)
                .send(entity);
        } else {
            resp.status(404)
                .send({});
        }

    }

    private async handlePost(entitySet: ServerEntitySet<any, any>,
                             req: Express.Request,
                             resp: Express.Response) {
        const created = await entitySet.DataProvider.PostAsync(req.body);
        resp.status(200).send(created);
    }

    private async handlePut(entitySet: ServerEntitySet<any, any>,
                            req: Express.Request,
                            resp: Express.Response) {
        const id = EndpointRoute.GetEntityIdFromPath(req.path);
        const result = await entitySet.DataProvider.PutAsync(id, req.body);
        resp.status(200).send(result);
    }

    private async handlePatch(entitySet: ServerEntitySet<any, any>,
                              req: Express.Request,
                              resp: Express.Response) {

        const id = EndpointRoute.GetEntityIdFromPath(req.path);
        const entity = await entitySet.DataProvider.GetSingleAsync(id);
        const result = await entitySet.DataProvider.PatchAsync(id, req.body);
        resp.status(200)
            .send(result);
    }

    private async handleDelete(entitySet: ServerEntitySet<any, any>,
                               req: Express.Request,
                               resp: Express.Response) {
        const id = EndpointRoute.GetEntityIdFromPath(req.path);
        const result = await entitySet.DataProvider.Delete(id);
        resp.status(204).send({});
    }

    private async handleWrapper(handler: requestHandler,
                                entitySet: ServerEntitySet<any, any>, req: Express.Request, resp: Express.Response) {
        try {
            await handler(entitySet, req, resp);
        } catch (error) {
            resp.status(500)
                .send({
                    error: {
                        message: error.message,
                    },
                });
        }
    }

    private registerEntitySets() {
        this.entitySets.forEach((entitySet) => {
            this.router.get([`/${entitySet.Name}`, `/${entitySet.Name}/`], async (req, resp) =>
                this.handleWrapper(this.handleGetCollection, entitySet, req, resp));

            this.router.get(`/${entitySet.Name}(:id)`, async (req, resp) =>
                this.handleWrapper(this.handleGetSingleEntity, entitySet, req, resp));

            this.router.post(`/${entitySet.Name}`, async (req, resp) =>
                this.handleWrapper(this.handlePost, entitySet, req, resp));

            this.router.put(`/${entitySet.Name}(:id)`, async (req, resp) =>
                this.handleWrapper(this.handlePut, entitySet, req, resp));

            this.router.patch(`/${entitySet.Name}(:id)`, async (req, resp) =>
                this.handleWrapper(this.handlePatch, entitySet, req, resp));

            this.router.delete(`/${entitySet.Name}(:id)`, async (req, resp) =>
                this.handleWrapper(this.handleDelete, entitySet, req, resp));

            entitySet.GetActions().forEach((action) => {
                this.registerActionTo(action, `/${entitySet.Name}/`);
            });

            const entityType = this.entityTypes.find((type) => type.Name === entitySet.EndpointEntityType.Name);
            entityType.GetActions().forEach((action) => {
                this.registerActionTo(action, `/${entitySet.Name}(:id)/`);
            });

        });

    }

    private registerActionTo<TBody, TReturns>(action: ServerCustomAction<TBody, TReturns>, path: string) {
        const fullPath = `${path}${action.Name}`;
        const evaluate = async (req, resp) => {
            try {
                const response = await action.CallAsync(req.body, req);
                resp.status(200).send(response);
            } catch (error) {
                resp.status(500).send({
                    error,
                    message: `Error happened during evaluation CustomAction '${action.Name}'`,
                });
            }
        };
        switch (action.RequestType) {
                case 'GET':
                    this.router.get(fullPath, evaluate);
                    break;
                case 'POST':
                    this.router.post(fullPath, evaluate);
                    break;
                case 'PUT':
                    this.router.put(fullPath, evaluate);
                    break;
                case 'PATCH':
                    this.router.patch(fullPath, evaluate);
                case 'DELETE':
                    this.router.delete(fullPath, evaluate);
                default:
                    break;
            }
    }
    private registerGlobalActions(): void {
        this.implementedActions.forEach((action) => {
            this.registerActionTo(action, '/');
        });
    }

    private registerExpressRoute(expressAppRef: Express.Application) {

        this.router.get('/([\$])metadata', (req, resp) => {
            resp
                // .set("Content-Type", "text/xml")
                .status(200)
                .send(this.GetMetadataBody());
        });

        this.registerEntitySets();
        this.registerGlobalActions();

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
    constructor(protected EndpointBuilder: EndpointBuilder) {
        super();
        this.entitySets = EndpointBuilder.GetAllEntitySets().map((s) =>
            new ServerEntitySet(s,
                s.EndpointEntityType.ModelDescriptor.Object,
                // tslint:disable-next-line:max-line-length
                s.EndpointEntityType.ModelDescriptor.Object[s.EndpointEntityType.ModelDescriptor.PrimaryKey.PrimaryKey] ));
        this.entityTypes = EndpointBuilder.GetAllEntityTypes().map((s) => new ServerEntityType(s));
    }

    public RegisterRoutes(expressAppRef: Express.Application) {
        expressAppRef.use(BodyParser.json());
        this.registerExpressRoute(expressAppRef);
    }
}
