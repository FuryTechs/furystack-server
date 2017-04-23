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

builder.EntityType(OtherClass);
builder.EntityType(Alma);

builder.EntitySet(OtherClass, 'others');
builder.EntitySet(Alma, 'almak');

const endpoint = new EndpointRoute(app, builder);

app.listen(1111);
