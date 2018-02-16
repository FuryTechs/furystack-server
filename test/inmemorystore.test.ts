import { expect } from "chai";
import { ForeignKey, PrimaryKey } from "furystack-core";
import { InMemoryProvider } from "../src/dataproviders";
import { TestHelpers } from "./";

// tslint:disable:max-classes-per-file

class TestChild {
    public id: number;
    public value: string;
}

// tslint:disable-next-line:max-classes-per-file
class TestClass {
    @PrimaryKey
    public id: number;
    public name: string;
    public otherValue?: string;

    public childId?: number;
    @ForeignKey(TestChild, "childId")
    public child?: TestChild;
}

describe("In Memory Store", () => {

    let store: InMemoryProvider<TestClass, number, keyof TestClass>;
    beforeEach(() => {
        store = InMemoryProvider.CreateWithId(TestClass);
    });

    it("NotFound should return empty array", async () => {
        const result = await store.GetSingleAsync(1);
        chai.expect(result).equals(undefined);
    });

    it("Test Store Post method", async () => {
        const name = TestHelpers.RandomString(3);
        const otherVal = TestHelpers.RandomString(3);

        const postResult = await store.PostAsync({
            id: 1,
            name,
            otherValue: otherVal,
        });
        const reloaded = await store.GetSingleAsync(postResult.id);
        chai.expect(reloaded.name).equals(name);
        chai.expect(reloaded.otherValue).equals(otherVal);
    });
    it("Test POST and assert GetCollection length", async () => {
        const n1 = TestHelpers.RandomString(3);
        const n2 = TestHelpers.RandomString(3);

        await store.PostAsync({ id: 1, name: n1 });
        await store.PostAsync({ id: 2, name: n2 });

        const result = await store.GetCollectionAsync();
        chai.expect(result.value.length).equals(2);
    });

    it("Test POST and Patch, expect that only the patched values will be changed", async () => {
        const id = 1;
        const n1 = TestHelpers.RandomString(3);
        const v1 = TestHelpers.RandomString(3);

        const v2 = TestHelpers.RandomString(3);
        await store.PostAsync({ id, name: n1, otherValue: v1 });

        const entity = await store.GetSingleAsync(id);

        chai.expect(entity.name).equals(n1);
        chai.expect(entity.otherValue).equals(v1);

        await store.PatchAsync(id, { otherValue: v2 });

        const reloaded = await store.GetSingleAsync(id);

        chai.expect(reloaded.name).equals(n1);
        chai.expect(reloaded.otherValue).equals(v2);
    });

    it("Test POST and PUT, expect that the not provided property will be nulled", async () => {
        const id = 1;
        const n1 = TestHelpers.RandomString(3);
        const v1 = TestHelpers.RandomString(3);

        const n2 = TestHelpers.RandomString(3);
        await store.PostAsync({ id, name: n1, otherValue: v1 });

        const entity = await store.GetSingleAsync(id);

        chai.expect(entity.name).equals(n1);
        chai.expect(entity.otherValue).equals(v1);

        await store.PutAsync(id, { id, name: n2 });

        const reloaded = await store.GetSingleAsync(id);

        chai.expect(reloaded.name).equals(n2);
        chai.expect(reloaded.otherValue).equals(undefined);
    });

    it("Test POST and Delete", async () => {
        const e1: TestClass = {
            id: 1,
            name: TestHelpers.RandomString(3),
        };

        const e2: TestClass = {
            id: 2,
            name: TestHelpers.RandomString(3),
        };

        await store.PostAsync(e1);
        await store.PostAsync(e2);

        const res = await store.GetCollectionAsync();
        chai.expect(res.value.length).equals(2);

        await store.Delete(e1.id);

        const res2 = await store.GetCollectionAsync();
        chai.expect(res2.value.length).equals(1);
        chai.expect(res2.value[0].id).equals(e2.id);

        await store.Delete(e2.id);
        const res3 = await store.GetCollectionAsync();
        chai.expect(res3.value.length).equals(0);
    });
});
