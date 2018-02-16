import * as chai from "chai";
import chaiHttp = require("chai-http");
import * as Express from "express";
import { CollectionResult, EndpointBuilder, PrimaryKey, Property } from "furystack-core";
import { Server } from "http";
import { EndpointRoute } from "../src/endpointroute";
import { DataProviderBase, InMemoryProvider } from "../src/index";
import { ServerCustomAction } from "../src/ServerScoped/index";

// tslint:disable:max-classes-per-file

const expect = chai.expect;

class TestClass {
    @PrimaryKey
    public id: number;

    @Property
    public value: string;

    @Property
    public value2?: string;
}

class TestGuidClass {
    @PrimaryKey
    public guid: string;

    @Property
    public value: string;
}

export const endpointTests = describe("Endpoint Tests", () => {

    let endpointRoute: EndpointRoute;
    let endpointBuilder: EndpointBuilder;
    let expressApp: Express.Application = Express();
    let testStore: DataProviderBase<TestClass, number>;

    let testGuidStore: DataProviderBase<TestGuidClass, string>;
    let chaiHttpAgent: ChaiHttp.Agent;
    let server: Server;
    const route: string = "api";

    const testCollectionName = "testentities";
    const testGuidCollectionName = "testGuidCollectionName";

    chai.use(chaiHttp);

    beforeEach(() => {

        expressApp = Express();
        endpointBuilder = new EndpointBuilder(route);

        testStore = new InMemoryProvider(TestClass);
        endpointBuilder.EntityType(TestClass);
        endpointBuilder.EntitySet(TestClass, testCollectionName);

        testGuidStore = new InMemoryProvider(TestGuidClass);
        endpointBuilder.EntityType(TestGuidClass);
        endpointBuilder.EntitySet(TestGuidClass, testGuidCollectionName);

        endpointRoute = new EndpointRoute(endpointBuilder);
        endpointRoute.EntitySet(TestClass, testCollectionName)
            .SetDataProvider(testStore);

        endpointRoute.EntitySet(TestGuidClass, testGuidCollectionName)
            .SetDataProvider(testGuidStore);

        endpointRoute.RegisterRoutes(expressApp);

        server = expressApp.listen(0);

        chaiHttpAgent = chai.request(expressApp);
    });

    afterEach(() => {
        /**  */
        server.close();

    });

    it("Endpoint route creation", () => {
        expect(endpointRoute).not.equals(undefined);
    });

    // it("Express server started", (done: MochaDone) => {
    //     const server = expressApp.listen(3000, () => {
    //         server.close();
    //         done();
    //     });
    // });

    it("Check if $metadata is available", (done: MochaDone) => {
        const body = endpointRoute.GetMetadataBody();
        chaiHttpAgent
            .get("/" + route + "/$metadata")
            .then((res) => {
                chai.expect(res.body.message).to.eql(body);
                done();
            })
            .catch((err) => {
                done();
            });
    });

    it("Querying collection without defined DataProvider should throw error", (done: MochaDone) => {
        endpointBuilder.EntitySet(TestClass, "testClassWithoutDataProvider");

        // Need to register it again...
        endpointRoute = new EndpointRoute(endpointBuilder);
        endpointRoute.RegisterRoutes(expressApp);
        chaiHttpAgent
            .get("/" + route + "/testClassWithoutDataProvider")
            .then((res) => {
                done("Request should fail, but it succeeded.");
            }).catch((err) => {
                done();
            });
    });

    it("Check if an example entitySet has valid response and no members by default", (done: MochaDone) => {
        chaiHttpAgent
            .get("/" + route + "/" + testCollectionName)
            .then((res) => {
                chai.expect(res.status).to.be.eq(200);
                chai.expect((res.body as CollectionResult<TestClass>).value.length).to.be.eq(0);
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("Check if an example entitySet has valid response and returns added members", (done: MochaDone) => {
        testStore.PostAsync({
            id: 1,
            value: "alma",
        });
        chaiHttpAgent
            .get("/" + route + "/" + testCollectionName)
            .then((res) => {
                const responseValue = res.body as CollectionResult<TestClass>;
                chai.expect(res.status).to.be.eq(200);
                chai.expect(responseValue.value.length).to.be.eq(1);
                chai.expect(responseValue.value[0].value).to.be.eq("alma");
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("404 should be returned if querying an entity that doesn't exists", (done: MochaDone) => {
        chaiHttpAgent
            .get(`/${route}/${testCollectionName}\(1\)`)
            .then((res) => {
                done("404 shuld be returned, but the request succeeded");
            }).catch((err) => {
                done();
            });
    });

    it("Check if getting a single entity will be returned correctly", (done: MochaDone) => {
        testStore.PostAsync({
            id: 1,
            value: "alma",
        });
        chaiHttpAgent
            .get(`/${route}/${testCollectionName}(1)`)
            .then((res) => {
                const responseValue = res.body as TestClass;
                chai.expect(res.status).to.be.eq(200);
                chai.expect(responseValue.value).to.be.eq("alma");
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("Check if getting a single entity with guid will be returned correctly", (done: MochaDone) => {
        testGuidStore.PostAsync({
            guid: "alma",
            value: "alma",
        });
        chaiHttpAgent
            .get(`/${route}/${testGuidCollectionName}(alma)`)
            .then((res) => {
                const responseValue = res.body as TestClass;
                chai.expect(res.status).to.be.eq(200);
                chai.expect(responseValue.value).to.be.eq("alma");
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("Check if entity is available in store after post", (done: MochaDone) => {
        chaiHttpAgent
            .post(`/${route}/${testCollectionName}`)
            .set("content-type", "application/json")
            .send({
                id: 4,
                value: "körte",
            } as TestClass)
            .then((res) => {
                const responseValue = res.body as TestClass;
                chai.expect(res.status).to.be.eq(200);
                chai.expect(responseValue.value).to.be.eq("körte");
                chai.expect(responseValue.id).to.be.eq(4);

                testStore.GetSingleAsync(4).then((result) => {
                    chai.expect(result.id).to.be.eq(4);
                    chai.expect(result.value).to.be.eq("körte");
                    done();
                }, done);

            }).catch((err) => {
                done(err);
            });
    });

    it("Posting an entity that already exists in should fail", (done: MochaDone) => {
        testStore.PostAsync({
            id: 1,
            value: "alma",
        });
        chaiHttpAgent
            .post(`/${route}/${testCollectionName}`)
            .set("content-type", "application/json")
            .send({
                id: 1,
                value: "körte",
            } as TestClass)
            .then((res) => {
                done("Entity post with the same ID should fail, but it was successful");
            }).catch((err) => {
                done();
            });
    });

    it("PUTting an entity that already exists should overwrite all property", (done: MochaDone) => {
        testStore.PostAsync({
            id: 1,
            value: "alma",
        });
        chaiHttpAgent
            .put(`/${route}/${testCollectionName}(1)`)
            .set("content-type", "application/json")
            .send({
                id: 1,
                value2: "Körte",
            } as TestClass)
            .then((res) => {
                const returned = res.body as TestClass;
                chai.expect(returned.value).to.be.eq(undefined);
                testStore.GetSingleAsync(1).then((result) => {
                    chai.expect(result.value).to.be.eq(undefined);
                    chai.expect(result.value2).to.be.eq("Körte");
                    done();
                }, done);
            }).catch(done);
    });

    it("Patching an entity that already exists should overwrite changed property only", (done: MochaDone) => {
        testStore.PostAsync({
            id: 1,
            value: "alma",
        });
        chaiHttpAgent
            .patch(`/${route}/${testCollectionName}(1)`)
            .set("content-type", "application/json")
            .send({
                id: 1,
                value2: "Körte",
            } as TestClass)
            .then((res) => {
                const returned = res.body as TestClass;
                chai.expect(returned.value).to.be.eq("alma");
                testStore.GetSingleAsync(1).then((result) => {
                    chai.expect(result.value).to.be.eq("alma");
                    chai.expect(result.value2).to.be.eq("Körte");
                    done();
                }, done);
            }).catch(done);
    });

    it("Delete should remove an entity", (done: MochaDone) => {
        testStore.PostAsync({
            id: 1,
            value: "alma",
        });
        chaiHttpAgent
            .del(`/${route}/${testCollectionName}(1)`)
            .then((res) => {
                chai.expect(res.status).to.be.eq(204);
                testStore.GetSingleAsync(1).then((result) => {
                    chai.expect(result).to.be.eq(undefined);
                    done();
                }, done);
            }).catch(done);
    });

    it("ImplementAction should implement a correct action", async () => {
        const builder = new EndpointBuilder("api");
        builder.CustomAction("CustomAction", "GET", TestClass, TestClass);
        const newroute = new EndpointRoute(builder);
        let actionCalled = false;

        newroute.ImplementAction("CustomAction", async (arg, req) => {
            actionCalled = true;
            return new TestClass();
        });

        await newroute.CallAction("CustomAction", new TestClass(), null);
        chai.expect(actionCalled).to.be.eq(true);
    });

    it("Should be able to get EntitySet with name", () => {
        const builder = new EndpointBuilder("api");
        builder.EntitySet(TestClass, "tests");
        const myroute = new EndpointRoute(builder);
        const serverSet = myroute.EntitySet(TestClass, "tests");
        chai.expect(serverSet.Name).to.be.eq("tests");
    });

    it("Should throw error if no entitySet found by name", () => {
        const builder = new EndpointBuilder("api");
        builder.EntitySet(TestClass, "tests");
        const myroute = new EndpointRoute(builder);

        chai.expect(() => {
            myroute.EntitySet(TestClass, "tests2");
        }).to.throw();
    });

    it("Should be able to get EntitySet without name", () => {
        const builder = new EndpointBuilder("api");
        builder.EntitySet(TestClass, "tests");
        const myroute = new EndpointRoute(builder);
        const serverSet = myroute.EntitySet(TestClass);
        chai.expect(serverSet.Name).to.be.eq("tests");
    });

    it("Getting EntitySet without name should throw if found multiple or not found.", () => {
        const builder = new EndpointBuilder("api");
        builder.EntitySet(TestClass, "tests");
        builder.EntitySet(TestClass, "tests2");
        const myroute = new EndpointRoute(builder);

        chai.expect(() => {
            const serverSet = myroute.EntitySet(TestClass);
        }).to.throw();
    });

    it("Getting EntitySet without name should throw if found multiple or not found.", () => {
        const builder = new EndpointBuilder("api");
        builder.EntitySet(TestClass, "tests");
        builder.EntitySet(TestClass, "tests2");
        const myroute = new EndpointRoute(builder);

        const entityType = myroute.EntityType(TestClass);

        chai.expect(entityType.Name).to.be.eq("TestClass");
    });

    it("CustomGlobalActionTest", (done: MochaDone) => {
        const builder = new EndpointBuilder("apiGlobalGet");
        builder.CustomAction("CustomAction", "GET", TestClass, TestClass);
        const myroute = new EndpointRoute(builder);
        myroute.ImplementAction("CustomAction", async (req, resp) => {
            const t = new TestClass();
            t.value = "FromCustomAction";
            return t;
        });
        myroute.RegisterRoutes(expressApp);

        chaiHttpAgent
            .get("/apiGlobalGet/CustomAction")
            .then((res) => {
                chai.expect(res.body.value).to.be.eq("FromCustomAction");
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("CustomCollectionlActionTest", (done: MochaDone) => {
        const builder = new EndpointBuilder("ApiCollectionPost");
        builder.EntitySet(TestClass, "tests")
            .CustomAction("CollectionAction", "POST", TestClass, TestClass);

        const myroute = new EndpointRoute(builder);
        myroute.EntitySet(TestClass)
            .ImplementAction("CollectionAction", async (req, resp) => {
                const t = new TestClass();
                t.value = "FromCollectionAction";
                return t;
            });
        myroute.RegisterRoutes(expressApp);

        chaiHttpAgent
            .post("/ApiCollectionPost/tests/CollectionAction")
            .then((res) => {
                chai.expect(res.body.value).to.be.eq("FromCollectionAction");
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("CustomEntityTypeActionTest", (done: MochaDone) => {
        const builder = new EndpointBuilder("ApiTypeActionPut");
        builder.EntitySet(TestClass, "tests");
        builder.EntityType(TestClass)
            .CustomAction("EntityTypeAction", "PUT", TestClass, TestClass);

        const myroute = new EndpointRoute(builder);
        myroute.EntityType(TestClass)
            .ImplementAction("EntityTypeAction", async (req, resp) => {
                const t = new TestClass();
                t.value = "FromType";
                return t;
            });
        myroute.RegisterRoutes(expressApp);

        chaiHttpAgent
            .put("/ApiTypeActionPut/tests(1)/EntityTypeAction")
            .then((res) => {
                chai.expect(res.body.value).to.be.eq("FromType");
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("CustomEntityTypePatchActionTest", (done: MochaDone) => {
        const builder = new EndpointBuilder("ApiTypeActionPut");
        builder.EntitySet(TestClass, "tests");
        builder.EntityType(TestClass)
            .CustomAction("EntityTypeAction", "PATCH", TestClass, TestClass);

        const myroute = new EndpointRoute(builder);
        myroute.EntityType(TestClass)
            .ImplementAction("EntityTypeAction", async (req, resp) => {
                const t = new TestClass();
                t.value = "FromType";
                return t;
            });
        myroute.RegisterRoutes(expressApp);

        chaiHttpAgent
            .patch("/ApiTypeActionPut/tests(1)/EntityTypeAction")
            .then((res) => {
                chai.expect(res.body.value).to.be.eq("FromType");
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("CustomEntityTypeDeleteActionTest", (done: MochaDone) => {
        const builder = new EndpointBuilder("ApiTypeActionPut");
        builder.EntitySet(TestClass, "tests");
        builder.EntityType(TestClass)
            .CustomAction("EntityTypeAction", "DELETE", TestClass, TestClass);

        const myroute = new EndpointRoute(builder);
        myroute.EntityType(TestClass)
            .ImplementAction("EntityTypeAction", async (req, resp) => {
                const t = new TestClass();
                t.value = "FromType";
                return t;
            });
        myroute.RegisterRoutes(expressApp);

        chaiHttpAgent
            .del("/ApiTypeActionPut/tests(1)/EntityTypeAction")
            .then((res) => {
                chai.expect(res.body.value).to.be.eq("FromType");
                done();
            }).catch((err) => {
                done(err);
            });
    });

    it("CustomEntityTypeActionErrorTest", (done: MochaDone) => {
        const builder = new EndpointBuilder("ApiTypeActionPut");
        builder.EntitySet(TestClass, "tests");
        builder.EntityType(TestClass)
            .CustomAction("EntityTypeAction", "GET", TestClass, TestClass);

        const myroute = new EndpointRoute(builder);
        myroute.EntityType(TestClass)
            .ImplementAction("EntityTypeAction", async (req, resp) => {
                throw Error("Noooooo (by: Mark Hamil)");
            });
        myroute.RegisterRoutes(expressApp);

        chaiHttpAgent
            .get("/ApiTypeActionPut/tests(1)/EntityTypeAction")
            .then((res) => {
                done("An error was expected here, but request succeeded.");
            }).catch((err) => {
                done();
            });
    });
});
