import {
  assertSpyCall,
  assertSpyCalls,
  returnsNext,
  stub,
} from "https://deno.land/std@0.190.0/testing/mock.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import {
  _internals,
  handleToken,
  isPositiveIntLessThan1000,
  isPunctuation,
} from "../llm.service.ts";

Deno.test("isPunctuation", async (t) => {
  await t.step("Punctuation", () => {
    assertEquals(isPunctuation("."), true);
    assertEquals(isPunctuation("!"), true);
    assertEquals(isPunctuation("?"), true);
    assertEquals(isPunctuation(","), true);
  });

  await t.step("Not punctuation", () => {
    const text = "Hello, world";
    const expected = false;

    assertEquals(isPunctuation(text), expected);
  });

  await t.step("Empty string", () => {
    const text = "";
    const expected = false;

    assertEquals(isPunctuation(text), expected);
  });

  await t.step("Number", () => {
    const text = "1";
    const expected = false;

    assertEquals(isPunctuation(text), expected);
  });

  await t.step("New line", () => {
    const text = "\n";
    const expected = false;

    assertEquals(isPunctuation(text), expected);
  });

  await t.step("Space", () => {
    const text = " ";
    const expected = false;

    assertEquals(isPunctuation(text), expected);
  });
});

Deno.test("isPositiveIntLessThan1000", async (t) => {
  await t.step("Number less than 1000", () => {
    assertEquals(isPositiveIntLessThan1000("999"), true);
    assertEquals(isPositiveIntLessThan1000("1"), true);
    assertEquals(isPositiveIntLessThan1000("0"), true);
    assertEquals(isPositiveIntLessThan1000("99"), true);
    assertEquals(isPositiveIntLessThan1000("100"), true);
  });

  await t.step("Number greater than 1000", () => {
    assertEquals(isPositiveIntLessThan1000("1000"), false);
    assertEquals(isPositiveIntLessThan1000("1001"), false);
    assertEquals(isPositiveIntLessThan1000("9999"), false);
    assertEquals(isPositiveIntLessThan1000("10000"), false);
  });

  await t.step("Negative number", () => {
    assertEquals(isPositiveIntLessThan1000("-1"), false);
    assertEquals(isPositiveIntLessThan1000("-100"), false);
    assertEquals(isPositiveIntLessThan1000("-999"), false);
    assertEquals(isPositiveIntLessThan1000("-1000"), false);
    assertEquals(isPositiveIntLessThan1000("-1001"), false);
  });

  await t.step("Empty string", () => {
    const text = "";
    const expected = false;

    assertEquals(isPositiveIntLessThan1000(text), expected);
  });

  await t.step("Punctuation", () => {
    const text = ".";
    const expected = false;

    assertEquals(isPositiveIntLessThan1000(text), expected);
  });

  await t.step("New line", () => {
    const text = "\n";
    const expected = false;

    assertEquals(isPositiveIntLessThan1000(text), expected);
  });

  await t.step("Space", () => {
    const text = " ";
    const expected = false;

    assertEquals(isPositiveIntLessThan1000(text), expected);
  });

  await t.step("Letter", () => {
    const text = "a";
    const expected = false;

    assertEquals(isPositiveIntLessThan1000(text), expected);
  });
});

Deno.test("handleToken", async (t) => {
  await t.step("token is new line", () => {
    const text = "Here is an example:";
    const token = "\n";
    const expected = "Here is an example:\n";

    assertEquals(handleToken(text, token), expected);
  });

  await t.step("token is punctuation", () => {
    const isPunctuationStub = stub(
      _internals,
      "isPunctuation",
      returnsNext([true]),
    );

    const text = "Hello, world";
    const token = "!";
    const expected = "Hello, world!";

    try {
      assertEquals(handleToken(text, token), expected);
    } finally {
      isPunctuationStub.restore();
    }

    assertSpyCall(isPunctuationStub, 0, {
      args: ["!"],
      returned: true,
    });
  });

  await t.step("token is number under 1000", async (t) => {
    await t.step("Previous char not number or coma", () => {
      const isPositiveIntLessThan1000Stub = stub(
        _internals,
        "isPositiveIntLessThan1000",
        returnsNext([true, false]),
      );

      const text = "Apollo";
      const token = "11";
      const expected = "Apollo 11";

      try {
        assertEquals(handleToken(text, token), expected);
      } finally {
        isPositiveIntLessThan1000Stub.restore();
      }

      // Need to test twice because first the function checks if the token is a
      // is number less than 1000, then it checks if the end of the previous
      // token is a number less than 1000.
      assertSpyCall(isPositiveIntLessThan1000Stub, 0, {
        args: ["11"],
        returned: true,
      });

      assertSpyCall(isPositiveIntLessThan1000Stub, 1, {
        args: ["o"],
        returned: false,
      });
    });

    await t.step("Previous char is number", () => {
      const isPositiveIntLessThan1000Stub = stub(
        _internals,
        "isPositiveIntLessThan1000",
        returnsNext([true, true]),
      );

      const text = "100";
      const token = "1";
      const expected = "1001";

      try {
        assertEquals(handleToken(text, token), expected);
      } finally {
        isPositiveIntLessThan1000Stub.restore();
      }

      assertSpyCall(isPositiveIntLessThan1000Stub, 0, {
        args: ["1"],
        returned: true,
      });

      assertSpyCall(isPositiveIntLessThan1000Stub, 1, {
        args: ["0"],
        returned: true,
      });
    });

    await t.step("Previous char is comma", () => {
      const isPositiveIntLessThan1000Stub = stub(
        _internals,
        "isPositiveIntLessThan1000",
        returnsNext([true, false]),
      );

      const text = "123,";
      const token = "321";
      const expected = "123,321";

      try {
        assertEquals(handleToken(text, token), expected);
      } finally {
        isPositiveIntLessThan1000Stub.restore();
      }

      assertSpyCall(isPositiveIntLessThan1000Stub, 0, {
        args: ["321"],
        returned: true,
      });

      assertSpyCall(isPositiveIntLessThan1000Stub, 1, {
        args: [","],
        returned: false,
      });
    });
  });

  await t.step("token is empty string", () => {
    const text = "Gödel, Escher, Bach";
    const token = "";
    const expected = "Gödel, Escher, Bach";

    assertEquals(handleToken(text, token), expected);
  });

  await t.step("token is string", () => {
    const isPositiveIntLessThan1000Stub = stub(
      _internals,
      "isPositiveIntLessThan1000",
      returnsNext([false]),
    );

    const isPunctuationStub = stub(
      _internals,
      "isPunctuation",
      returnsNext([false]),
    );

    const text = "100";
    const token = "gecs";
    const expected = "100 gecs";

    try {
      assertEquals(handleToken(text, token), expected);
    } finally {
      isPositiveIntLessThan1000Stub.restore();
      isPunctuationStub.restore();
    }

    assertSpyCall(isPositiveIntLessThan1000Stub, 0, {
      args: ["gecs"],
      returned: false,
    });

    assertSpyCall(isPunctuationStub, 0, {
      args: ["gecs"],
      returned: false,
    });
  });
});
