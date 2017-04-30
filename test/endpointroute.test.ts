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

    @Property
    public Value2?: string;
}

class TestGuidClass {
    @PrimaryKey
    public Guid: string;

    @Property
    public Value: string;
}

@suite
export class EndpointTests {

    private EndpointRoute: EndpointRoute;
    private EndpointBuilder: EndpointBuilder;
    private ExpressApp: Express.Application = Express();
    private testStore: DataProviderBase<TestClass, number>;

    private testGuidStore: DataProviderBase<TestGuidClass, string>;
    private Route: string = 'api';

    private readonly testCollectionName = 'testentities';
    private readonly testGuidCollectionName = 'testGuidCollectionName';

    constructor() {
        chai.use(chaiHttp);
    }

    public before() {
        this.ExpressApp = Express();
        this.EndpointBuilder = new EndpointBuilder(this.Route);

        this.testStore = new InMemoryProvider(TestClass);
        this.EndpointBuilder.EntityType(TestClass);
        this.EndpointBuilder.EntitySet(TestClass, this.testCollectionName);

        this.testGuidStore = new InMemoryProvider(TestGuidClass);
        this.EndpointBuilder.EntityType(TestGuidClass);
        this.EndpointBuilder.EntitySet(TestGuidClass, this.testGuidCollectionName);

        this.EndpointRoute = new EndpointRoute(this.ExpressApp, this.EndpointBuilder);
        this.EndpointRoute.setDataProviderForEntitySet(this.testStore, this.testCollectionName);
        this.EndpointRoute.setDataProviderForEntitySet(this.testGuidStore, this.testGuidCollectionName);
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
        this.EndpointRoute.setDataProviderForEntitySet(dp, this.testCollectionName);
        chai.expect(dp).to.be.eq(this.EndpointRoute.getDataProviderForEntitySet(this.testCollectionName));
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

    @test('Querying collection without defined DataProvider should throw error')
    public testCollectionWithoutDataProvider(done: (err?: any) => void) {
        this.EndpointBuilder.EntitySet(TestClass, 'testClassWithoutDataProvider');

        // Need to register it again...
        this.EndpointRoute = new EndpointRoute(this.ExpressApp, this.EndpointBuilder);

        chai.request(this.ExpressApp)
            .get('/' + this.Route + '/testClassWithoutDataProvider')
            .then((res) => {
                done('Request should fail, but it succeeded.');
            }).catch((err) => {
                done();
            });
    }

    @test('Check if an example entitySet has valid response and no members by default')
    public testGetEmptyCollection(done: (err?: any) => void) {
        chai.request(this.ExpressApp)
            .get('/' + this.Route + '/' + this.testCollectionName)
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
        this.testStore.PostAsync({
            Id: 1,
            Value: 'alma',
        });
        chai.request(this.ExpressApp)
            .get('/' + this.Route + '/' + this.testCollectionName)
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

    @test('404 should be returned if querying an entity that doesn\'t exists')
    public testGetNotExistingEntity(done: (err?: any) => void) {
        chai.request(this.ExpressApp)
            .get(`/${this.Route}/${this.testCollectionName}\(1\)`)
            .then((res) => {
                done('404 shuld be returned, but the request succeeded');
            }).catch((err) => {
                done();
            });
    }

    @test('Check if getting a single entity will be returned correctly')
    public testGetSingleEntity(done: (err?: any) => void) {
        this.testStore.PostAsync({
            Id: 1,
            Value: 'alma',
        });
        chai.request(this.ExpressApp)
            .get(`/${this.Route}/${this.testCollectionName}(1)`)
            .then((res) => {
                const responseValue = res.body as TestClass;
                chai.expect(res.status).to.be.eq(200);
                chai.expect(responseValue.Value).to.be.eq('alma');
                done();
            }).catch((err) => {
                done(err);
            });
    }

    @test('Check if getting a single entity with guid will be returned correctly')
    public testGetSingleEntityGuid(done: (err?: any) => void) {
        this.testGuidStore.PostAsync({
            Guid: 'alma',
            Value: 'alma',
        });
        chai.request(this.ExpressApp)
            .get(`/${this.Route}/${this.testGuidCollectionName}(alma)`)
            .then((res) => {
                const responseValue = res.body as TestClass;
                chai.expect(res.status).to.be.eq(200);
                chai.expect(responseValue.Value).to.be.eq('alma');
                done();
            }).catch((err) => {
                done(err);
            });
    }

    @test('Check if entity is available in store after post')
    public testPostEntity(done: (err?: any) => void) {
        chai.request(this.ExpressApp)
            .post(`/${this.Route}/${this.testCollectionName}`)
            .set('content-type', 'application/json')
            .send({
                Id: 4,
                Value: 'körte',
            } as TestClass)
            .then((res) => {
                const responseValue = res.body as TestClass;
                chai.expect(res.status).to.be.eq(200);
                chai.expect(responseValue.Value).to.be.eq('körte');
                chai.expect(responseValue.Id).to.be.eq(4);

                this.testStore.GetSingleAsync(4).then((result) => {
                    chai.expect(result.Id).to.be.eq(4);
                    chai.expect(result.Value).to.be.eq('körte');
                    done();
                }, done);

            }).catch((err) => {
                done(err);
            });
    }

    @test('Posting an entity that already exists in should fail')
    public testPostExistingShouldFail(done: (err?: any) => void) {
        this.testStore.PostAsync({
            Id: 1,
            Value: 'alma',
        });
        chai.request(this.ExpressApp)
            .post(`/${this.Route}/${this.testCollectionName}`)
            .set('content-type', 'application/json')
            .send({
                Id: 1,
                Value: 'körte',
            } as TestClass)
            .then((res) => {
                done('Entity post with the same ID should fail, but it was successful');
            }).catch((err) => {
                done();
            });
    }

    @test('PUTting an entity that already exists should overwrite all property')
    public testPutOverrides(done: (err?: any) => void) {
        this.testStore.PostAsync({
            Id: 1,
            Value: 'alma',
        });
        chai.request(this.ExpressApp)
            .put(`/${this.Route}/${this.testCollectionName}(1)`)
            .set('content-type', 'application/json')
            .send({
                Id: 1,
                Value2: 'Körte',
            } as TestClass)
            .then((res) => {
                const returned = res.body as TestClass;
                chai.expect(returned.Value).to.be.eq(undefined);
                this.testStore.GetSingleAsync(1).then((result) => {
                    chai.expect(result.Value).to.be.eq(undefined);
                    chai.expect(result.Value2).to.be.eq('Körte');
                    done();
                }, done);
            }).catch(done);
    }

    @test('Patching an entity that already exists should overwrite changed property only')
    public testPatchOverrides(done: (err?: any) => void) {
        this.testStore.PostAsync({
            Id: 1,
            Value: 'alma',
        });
        chai.request(this.ExpressApp)
            .patch(`/${this.Route}/${this.testCollectionName}(1)`)
            .set('content-type', 'application/json')
            .send({
                Id: 1,
                Value2: 'Körte',
            } as TestClass)
            .then((res) => {
                const returned = res.body as TestClass;
                chai.expect(returned.Value).to.be.eq('alma');
                this.testStore.GetSingleAsync(1).then((result) => {
                    chai.expect(result.Value).to.be.eq('alma');
                    chai.expect(result.Value2).to.be.eq('Körte');
                    done();
                }, done);
            }).catch(done);
    }

    @test('Patching an entity that already exists should overwrite changed property only')
    public testDeleteRemove(done: (err?: any) => void) {
        this.testStore.PostAsync({
            Id: 1,
            Value: 'alma',
        });
        chai.request(this.ExpressApp)
            .del(`/${this.Route}/${this.testCollectionName}(1)`)
            .then((res) => {
                chai.expect(res.status).to.be.eq(204);
                this.testStore.GetSingleAsync(1).then((result) => {
                    chai.expect(result).to.be.eq(undefined);
                    done();
                }, done);
            }).catch(done);
    }
}
