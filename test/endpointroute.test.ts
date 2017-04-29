import * as chai from 'chai';
import * as Express from 'express';
import { CollectionResult, EndpointBuilder, PrimaryKey, Property } from 'furystack-core';
import { suite, test } from 'mocha-typescript';
import { EndpointRoute } from '../src/endpointroute';
import chaiHttp = require('chai-http');
import { DataProviderBase, InMemoryProvider } from '../src/index';

class TestClass {
    @PrimaryKey
    public Id: number;

    @Property
    public Value: string;
}

@suite
export class EndpointTests {

    private EndpointRoute: EndpointRoute;
    private EndpointBuilder: EndpointBuilder;
    private ExpressApp: Express.Application = Express();
    private store: DataProviderBase<TestClass, number>;
    private Route: string = 'api';

    private readonly collectionName = 'testentities';

    constructor() {
        chai.use(chaiHttp);
    }

    public before() {
        this.ExpressApp = Express();
        this.store = new InMemoryProvider(TestClass);
        this.EndpointBuilder = new EndpointBuilder(this.Route);
        this.EndpointBuilder.EntityType(TestClass);
        this.EndpointBuilder.EntitySet(TestClass, this.collectionName);
        this.EndpointRoute = new EndpointRoute(this.ExpressApp, this.EndpointBuilder);
        this.EndpointRoute.setDataProviderForEntitySet(this.store, this.collectionName);
    }

    @test('Endpoint route creation')
    public Create() {
        const assert = chai.expect(this.EndpointRoute).not.undefined;
    }

    @test('Express server started')
    public StartExpress(done: () => void) {
        this.ExpressApp.listen(3000, () => {
            done();
        });
    }

    @test('Set and Get DataStore should be the same')
    public SetGetDataProvider() {
        const dp = new InMemoryProvider(TestClass);
        this.EndpointRoute.setDataProviderForEntitySet(dp, this.collectionName);
        chai.expect(dp).to.be.eq(this.EndpointRoute.getDataProviderForEntitySet(this.collectionName));
    }

    @test('Check if $metadata is available')
    public CheckMetadataAvailable(done: () => void) {
        const body = this.EndpointRoute.GetMetadataBody();
        chai.request(this.ExpressApp)
            .get('/' + this.Route + '/$metadata')
            .then((res) => {
                chai.expect(res.body.message).to.eql(body);
                done();
            })
            .catch((err) => {
                done();
            });
    }

    @test('Check if an example entitySet has valid response and no members by default')
    public testGetEmptyCollection(done: (err?: any) => void) {
        chai.request(this.ExpressApp)
            .get('/' + this.Route + '/' + this.collectionName)
            .then((res) => {
                chai.expect(res.status).to.be.eq(200);
                chai.expect((res.body as CollectionResult<TestClass>).value.length).to.be.eq(0);
                done();
            }).catch((err) => {
                done(err);
            });
    }

    @test('Check if an example entitySet has valid response and returns added members')
    public testGetCollectionValues(done: (err?: any) => void) {
        this.store.PostAsync({
            Id: 1,
            Value: 'alma',
        });
        chai.request(this.ExpressApp)
            .get('/' + this.Route + '/' + this.collectionName)
            .then((res) => {
                const responseValue = res.body as CollectionResult<TestClass>;
                chai.expect(res.status).to.be.eq(200);
                chai.expect(responseValue.value.length).to.be.eq(1);
                chai.expect(responseValue.value[0].Value).to.be.eq('alma');
                done();
            }).catch((err) => {
                done(err);
            });
    }
}
