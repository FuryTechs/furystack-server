import * as Express from 'express';
import { EndpointBuilder, ForeignKey, PrimaryKey, Property } from 'furystack-core';
import { InMemoryProvider } from './dataproviders';
import { EndpointRoute } from './endpointroute';
const app = Express();

const builder = new EndpointBuilder('Api');

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
    @ForeignKey(OtherClass, 'otherKey')
    public otherClass: OtherClass;
}

builder.EntityType(OtherClass)
    .CustomAction('OtherClassTypeBoundAction', 'GET', OtherClass, OtherClass);
builder.EntityType(Alma);

builder.EntitySet(OtherClass, 'others');
builder.EntitySet(Alma, 'almak')
    .CustomAction('AlmaScopedAction', 'GET', Alma, Alma);

builder.CustomAction('GlobalAction', 'GET', Object, Object);

const endpointRoute = new EndpointRoute(app, builder);

const dataProvider = new InMemoryProvider(Alma);
dataProvider.PostAsync({
    a: null,
    b: null,
    id: 1,
    otherClass: null,
    otherKey: null,
});
endpointRoute.EntitySet(Alma, 'almak').SetDataProvider(dataProvider);

builder.CustomAction('Custom1', 'GET', String, Number);

endpointRoute.ImplementAction<string, number>('Custom1', (arg, req) => {
    return arg.length;
});

app.listen(1111);
