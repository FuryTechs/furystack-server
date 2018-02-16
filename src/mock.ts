import * as Express from "express";
import { EndpointBuilder, ForeignKey, PrimaryKey, Property } from "furystack-core";
import { InMemoryProvider } from "./dataproviders";
import { EndpointRoute } from "./endpointroute";
const app = Express();

const builder = new EndpointBuilder("Api");

class OtherClass {
    @PrimaryKey
    public id: number;
    public val: string;
}
// tslint:disable-next-line:max-classes-per-file
class Alma {

    @PrimaryKey
    public id: number;

    @Property
    public a: string;
    public b: string;

    public otherKey: number;
    @ForeignKey(OtherClass, "otherKey")
    public otherClass: OtherClass;
}

builder.EntityType(Alma);
builder.EntityType(OtherClass);
builder.EntitySet(OtherClass, "others");

builder.CustomAction("GetBodyLengthFromJson", "POST", Object, Object);

builder.EntityType(OtherClass)
    .CustomAction("OtherClassTypeBoundAction", "POST", OtherClass, OtherClass);

builder.EntitySet(Alma, "almak")
    .CustomAction("AlmaScopedAction", "POST", Alma, Alma);

/** Builder end, EndpointRoute Start... */

const endpointRoute = new EndpointRoute(builder);

const dataProvider = new InMemoryProvider(Alma);
dataProvider.PostAsync({
    a: "AProperty",
    b: "BProperty",
    id: 1,
    otherClass: null,
    otherKey: null,
});

dataProvider.PostAsync({
    a: "AProperty2",
    b: "BProperty2",
    id: 2,
    otherClass: null,
    otherKey: null,
});

dataProvider.PostAsync({
    a: "AProperty3",
    b: "BProperty3",
    id: 3,
    otherClass: null,
    otherKey: null,
});
endpointRoute.EntitySet(Alma)
    .ImplementAction<Alma, Alma>("AlmaScopedAction", async (arg, req) => {
        arg.a = arg.a + arg.a;
        return arg;
    })
    .SetDataProvider(dataProvider);

endpointRoute.ImplementAction<object, {JsonLength: number}>("GetBodyLengthFromJson", async (arg, req) => {
    return  { JsonLength: JSON.stringify(arg).length };
});

endpointRoute.EntityType(OtherClass)
    .ImplementAction("OtherClassTypeBoundAction", async (arg, req) => {
        return {Other: true};
    });

endpointRoute.RegisterRoutes(app);

app.listen(1111);
