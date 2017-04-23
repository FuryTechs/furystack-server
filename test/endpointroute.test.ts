import * as chai from 'chai';
import * as Express from 'express';
import { EndpointBuilder } from 'furystack-core';
import { suite, test } from 'mocha-typescript';
import { EndpointRoute } from '../src/endpointroute';
import chaiHttp = require('chai-http');

@suite
export class EndpointTests {

    private EndpointRoute: EndpointRoute;
    private EndpointBuilder: EndpointBuilder;
    private static ExpressApp: Express.Application = Express();
    private Route: string = 'api';

    constructor() {
        chai.use(chaiHttp);
    }

    public before() {
        this.EndpointBuilder = new EndpointBuilder(this.Route);
        this.EndpointRoute = new EndpointRoute(EndpointTests.ExpressApp, this.EndpointBuilder);
    }

    @test
    public Create() {
        const assert = chai.expect(this.EndpointRoute).not.undefined;
    }

    @test
    public StartExpress(done: () => void) {
        EndpointTests.ExpressApp.listen(3000, () => {
            done();
        });
    }

    @test
    public CheckApiRootAvailable(done: () => void) {

        const body = this.EndpointRoute.GetApiRootBody();

        chai.request(EndpointTests.ExpressApp)
            .get('/' + this.Route + '/')
            .then((res) => {
                chai.expect(res.body.message).to.eql(body);
                done();
            })
            .catch((err) => {
                done();
            });
    }

    @test
    public CheckMetadataAvailable(done: () => void) {
        const body = this.EndpointRoute.GetMetadataBody();
        chai.request(EndpointTests.ExpressApp)
            .get('/' + this.Route + '/$metadata')
            .then((res) => {
                chai.expect(res.body.message).to.eql(body);
                done();
            })
            .catch((err) => {
                done();
            });
    }
}
