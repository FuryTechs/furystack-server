import * as Express from 'express';
import { EndpointBuilder } from 'furystack-core';

export class EndpointRoute {

    /**
     * Returns the $metadata response body
     */
    public GetMetadataBody(): string {
        return JSON.stringify(this.EndpointBuilder);
    }

    private router: Express.Router = Express.Router();

    private registerCollections() {
        this.EndpointBuilder.GetAllEntitySets().forEach((entitySet) => {
            this.router.get(`/${entitySet.Name}`, (req, resp) => {
                // ToDo: Evaluate Get expression (collection with filter or single entity)
                resp.status(200)
                    .send(['get', entitySet]);
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
