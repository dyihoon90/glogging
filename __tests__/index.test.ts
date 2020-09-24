import { hello } from "../src";

describe('Hello world', () => {
  it('should return hello world', () => {
    expect(hello("test")).toEqual("Hello test!")
  });
});
