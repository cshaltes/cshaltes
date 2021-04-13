const tape = require("tape-await");
const d3 = require("../");

tape("histogram is a deprecated alias for bin", (test) => {
  test.strictEqual(d3.histogram, d3.bin);
});

tape("bin() returns a default bin generator", (test) => {
  const h = d3.bin();
  test.equal(h.value()(42), 42);
  test.equal(h.domain(), d3.extent);
  test.deepEqual(h.thresholds(), d3.thresholdSturges);
});

tape("bin(data) computes bins of the specified array of data", (test) => {
  const h = d3.bin();
  test.deepEqual(h([0, 0, 0, 10, 20, 20]), [
    bin([0, 0, 0], 0, 5),
    bin([], 5, 10),
    bin([10], 10, 15),
    bin([], 15, 20),
    bin([20, 20], 20, 25)
  ]);
});

tape("bin(iterable) is equivalent to bin(array)", (test) => {
  const h = d3.bin();
  test.deepEqual(h(iterable([0, 0, 0, 10, 20, 20])), [
    bin([0, 0, 0], 0, 5),
    bin([], 5, 10),
    bin([10], 10, 15),
    bin([], 15, 20),
    bin([20, 20], 20, 25)
  ]);
});

tape("bin.value(number) sets the constant value", (test) => {
  const h = d3.bin().value(12); // Pointless, but for consistency.
  test.deepEqual(h([0, 0, 0, 1, 2, 2]), [
    bin([0, 0, 0, 1, 2, 2], 12, 12),
  ]);
});

tape("bin.value(function) sets the value accessor", (test) => {
  const h = d3.bin().value((d) => d.value);
  const a = {value: 0};
  const b = {value: 10};
  const c = {value: 20};
  test.deepEqual(h([a, a, a, b, c, c]), [
    bin([a, a, a], 0, 5),
    bin([], 5, 10),
    bin([b], 10, 15),
    bin([], 15, 20),
    bin([c, c], 20, 25)
  ]);
});

tape("bin.domain(array) sets the domain", (test) => {
  const h = d3.bin().domain([0, 20]);
  test.deepEqual(h.domain()(), [0, 20]);
  test.deepEqual(h([1, 2, 2, 10, 18, 18]), [
    bin([1, 2, 2], 0, 5),
    bin([], 5, 10),
    bin([10], 10, 15),
    bin([18, 18], 15, 20)
  ]);
});

tape("bin.domain(function) sets the domain accessor", (test) => {
  let actual;
  const values = [1, 2, 2, 10, 18, 18];
  const domain = (values) => { actual = values; return [0, 20]; };
  const h = d3.bin().domain(domain);
  test.equal(h.domain(), domain);
  test.deepEqual(h(values), [
    bin([1, 2, 2], 0, 5),
    bin([], 5, 10),
    bin([10], 10, 15),
    bin([18, 18], 15, 20)
  ]);
  test.deepEqual(actual, values);
});

tape("bin.thresholds(number) sets the approximate number of bin thresholds", (test) => {
  const h = d3.bin().thresholds(3);
  test.deepEqual(h([0, 0, 0, 10, 30, 30]), [
    bin([0, 0, 0], 0, 10),
    bin([10], 10, 20),
    bin([], 20, 30),
    bin([30, 30], 30, 40)
  ]);
});

tape("bin.thresholds(array) sets the bin thresholds", (test) => {
  const h = d3.bin().thresholds([10, 20]);
  test.deepEqual(h([0, 0, 0, 10, 30, 30]), [
    bin([0, 0, 0], 0, 10),
    bin([10], 10, 20),
    bin([30, 30], 20, 30)
  ]);
});

tape("bin.thresholds(array) ignores thresholds outside the domain", (test) => {
  const h = d3.bin().thresholds([0, 1, 2, 3, 4]);
  test.deepEqual(h([0, 1, 2, 3]), [
    bin([0], 0, 1),
    bin([1], 1, 2),
    bin([2], 2, 3),
    bin([3], 3, 3)
  ]);
});

tape("bin.thresholds(function) sets the bin thresholds accessor", (test) => {
  let actual;
  const values = [0, 0, 0, 10, 30, 30];
  const h = d3.bin().thresholds((values, x0, x1) => { actual = [values, x0, x1]; return [10, 20]; });
  test.deepEqual(h(values), [
    bin([0, 0, 0], 0, 10),
    bin([10], 10, 20),
    bin([30, 30], 20, 30)
  ]);
  test.deepEqual(actual, [values, 0, 30]);
  test.deepEqual(h.thresholds(() => 5)(values), [
    bin([0, 0, 0], 0, 5),
    bin([], 5, 10),
    bin([10], 10, 15),
    bin([], 15, 20),
    bin([], 20, 25),
    bin([], 25, 30),
    bin([30, 30], 30, 35)
  ]);
});

tape("bin(data) uses nice thresholds", (test) => {
  const h = d3.bin().domain([0, 1]).thresholds(5);
  test.deepEqual(h([]).map(b => [b.x0, b.x1]), [
    [0.0, 0.2],
    [0.2, 0.4],
    [0.4, 0.6],
    [0.6, 0.8],
    [0.8, 1.0]
  ]);
});

tape("bin()() returns bins whose rightmost bin is not too wide", (test) => {
  const h = d3.bin();
  test.deepEqual(h([9.8, 10, 11, 12, 13, 13.2]), [
    bin([9.8], 9, 10),
    bin([10], 10, 11),
    bin([11], 11, 12),
    bin([12], 12, 13),
    bin([13, 13.2], 13, 14)
  ]);
});

tape("bin(data) coerces values to numbers as expected", (test) => {
  const h = d3.bin().thresholds(10);
  test.deepEqual(h(["1", "2", "3", "4", "5"]), [
    bin(["1"], 1, 1.5),
    bin([], 1.5, 2),
    bin(["2"], 2, 2.5),
    bin([], 2.5, 3),
    bin(["3"], 3, 3.5),
    bin([], 3.5, 4),
    bin(["4"], 4, 4.5),
    bin([], 4.5, 5),
    bin(["5"], 5, 5.5)
  ]);
});

function bin(bin, x0, x1)  {
  bin.x0 = x0;
  bin.x1 = x1;
  return bin;
}

function* iterable(array) {
  yield* array;
}
