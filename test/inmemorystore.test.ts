import * as chai from 'chai';
import { ForeignKey, PrimaryKey } from 'furystack-core';
import { suite, test } from 'mocha-typescript';
import { InMemoryProvider } from '../src/dataproviders';
import { TestHelpers } from './';
class TestChild {
    public Id: number;
    public Value: string;
}

// tslint:disable-next-line:max-classes-per-file
class TestClass {
    @PrimaryKey
    public Id: number;
    public Name: string;
    public OtherValue?: string;

    public ChildId?: number;
    @ForeignKey(TestChild, 'ChildId')
    public Child?: TestChild;
}

// tslint:disable-next-line:max-classes-per-file
@suite('In Memory Store tests')
export class InMemoryStoreTests {
    private store: InMemoryProvider<TestClass, number, keyof TestClass>;

    public before() {
        this.store = InMemoryProvider.CreateWithId(TestClass);
    }

    @test('NotFound should return empty array')
    public async NotFoundTest() {
        const result = await this.store.GetSingleAsync(1);

        chai.expect(result).equals(undefined);
    }

    @test('Test Store Post method')
    public async Post() {

        const name = TestHelpers.RandomString(3);
        const otherVal = TestHelpers.RandomString(3);

        const postResult = await this.store.PostAsync({
            Id: 1,
            Name: name,
            OtherValue: otherVal,
        });
        const reloaded = await this.store.GetSingleAsync(postResult.Id);
        chai.expect(reloaded.Name).equals(name);
        chai.expect(reloaded.OtherValue).equals(otherVal);
    }

    @test('Test POST and assert GetCollection length')
    public async PostGetCollection() {
        const n1 = TestHelpers.RandomString(3);
        const n2 = TestHelpers.RandomString(3);

        await this.store.PostAsync({ Id: 1, Name: n1 });
        await this.store.PostAsync({ Id: 2, Name: n2 });

        const result = await this.store.GetCollectionAsync();
        chai.expect(result.value.length).equals(2);
    }

    @test('Test POST and Patch, expect that only the patched values will be changed')
    public async PostPatchGetSingle() {
        const id = 1;
        const n1 = TestHelpers.RandomString(3);
        const v1 = TestHelpers.RandomString(3);

        const v2 = TestHelpers.RandomString(3);
        await this.store.PostAsync({ Id: id, Name: n1, OtherValue: v1 });

        const entity = await this.store.GetSingleAsync(id);

        chai.expect(entity.Name).equals(n1);
        chai.expect(entity.OtherValue).equals(v1);

        await this.store.PatchAsync(id, { OtherValue: v2 });

        const reloaded = await this.store.GetSingleAsync(id);

        chai.expect(reloaded.Name).equals(n1);
        chai.expect(reloaded.OtherValue).equals(v2);
    }

    @test('Test POST and PUT, expect that the not provided property will be nulled')
    public async PostPutGetSingle() {
        const id = 1;
        const n1 = TestHelpers.RandomString(3);
        const v1 = TestHelpers.RandomString(3);

        const n2 = TestHelpers.RandomString(3);
        await this.store.PostAsync({ Id: id, Name: n1, OtherValue: v1 });

        const entity = await this.store.GetSingleAsync(id);

        chai.expect(entity.Name).equals(n1);
        chai.expect(entity.OtherValue).equals(v1);

        await this.store.PutAsync(id, { Id: id, Name: n2 });

        const reloaded = await this.store.GetSingleAsync(id);

        chai.expect(reloaded.Name).equals(n2);
        chai.expect(reloaded.OtherValue).equals(undefined);
    }

    @test('Test POST and Delete')
    public async PostDelete() {
        const e1: TestClass = {
            Id: 1,
            Name: TestHelpers.RandomString(3),
        };

        const e2: TestClass = {
            Id: 2,
            Name: TestHelpers.RandomString(3),
        };

        await this.store.PostAsync(e1);
        await this.store.PostAsync(e2);

        const res = await this.store.GetCollectionAsync();
        chai.expect(res.value.length).equals(2);

        await this.store.Delete(e1.Id);

        const res2 = await this.store.GetCollectionAsync();
        chai.expect(res2.value.length).equals(1);
        chai.expect(res2.value[0].Id).equals(e2.Id);

        await this.store.Delete(e2.Id);
        const res3 = await this.store.GetCollectionAsync();
        chai.expect(res3.value.length).equals(0);
    }

}
