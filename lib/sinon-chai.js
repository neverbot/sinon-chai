/* eslint-disable no-invalid-this */
function sinonChai(chai, utils) {
    var slice = Array.prototype.slice;

    function isSpy(putativeSpy) {
        return typeof putativeSpy === "function" &&
               typeof putativeSpy.getCall === "function" &&
               typeof putativeSpy.calledWithExactly === "function";
    }

    function timesInWords(count) {
        switch (count) {
            case 1: {
                return "once";
            }
            case 2: {
                return "twice";
            }
            case 3: {
                return "thrice";
            }
            default: {
                return (count || 0) + " times";
            }
        }
    }

    function isCall(putativeCall) {
        return putativeCall && isSpy(putativeCall.proxy);
    }

    function assertCanWorkWith(assertion) {
        if (!isSpy(assertion._obj) && !isCall(assertion._obj)) {
            throw new TypeError(utils.inspect(assertion._obj) + " is not a spy or a call to a spy!");
        }
    }

    function getMessages(spy, action, nonNegatedSuffix, always, args) {
        var verbPhrase = always ? "always have " : "have ";
        nonNegatedSuffix = nonNegatedSuffix || "";
        if (isSpy(spy.proxy)) {
            spy = spy.proxy;
        }

        function printfArray(array) {
            return spy.printf.apply(spy, array);
        }

        return {
            affirmative: function () {
                return printfArray(["expected %n to " + verbPhrase + action + nonNegatedSuffix].concat(args));
            },
            negative: function () {
                return printfArray(["expected %n to not " + verbPhrase + action].concat(args));
            }
        };
    }

    function sinonProperty(name, action, nonNegatedSuffix) {
        utils.addProperty(chai.Assertion.prototype, name, function () {
            assertCanWorkWith(this);

            var messages = getMessages(this._obj, action, nonNegatedSuffix, false);
            this.assert(this._obj[name], messages.affirmative, messages.negative);
        });
    }

    function sinonPropertyAsBooleanMethod(name, action, nonNegatedSuffix) {
        utils.addMethod(chai.Assertion.prototype, name, function (arg) {
            assertCanWorkWith(this);

            var messages = getMessages(this._obj, action, nonNegatedSuffix, false, [timesInWords(arg)]);
            this.assert(this._obj[name] === arg, messages.affirmative, messages.negative);
        });
    }

    function createSinonMethodHandler(sinonName, action, nonNegatedSuffix) {
        return function () {
            assertCanWorkWith(this);

            var alwaysSinonMethod = "always" + sinonName[0].toUpperCase() + sinonName.substring(1);
            var shouldBeAlways = utils.flag(this, "always") && typeof this._obj[alwaysSinonMethod] === "function";
            var sinonMethodName = shouldBeAlways ? alwaysSinonMethod : sinonName;

            var messages = getMessages(this._obj, action, nonNegatedSuffix, shouldBeAlways, slice.call(arguments));
            this.assert(
                this._obj[sinonMethodName].apply(this._obj, arguments),
                messages.affirmative,
                messages.negative
            );
        };
    }

    function sinonMethodAsProperty(name, action, nonNegatedSuffix) {
        var handler = createSinonMethodHandler(name, action, nonNegatedSuffix);
        utils.addProperty(chai.Assertion.prototype, name, handler);
    }

    function exceptionalSinonMethod(chaiName, sinonName, action, nonNegatedSuffix) {
        var handler = createSinonMethodHandler(sinonName, action, nonNegatedSuffix);
        utils.addMethod(chai.Assertion.prototype, chaiName, handler);
    }

    function sinonMethod(name, action, nonNegatedSuffix) {
        exceptionalSinonMethod(name, name, action, nonNegatedSuffix);
    }

    utils.addProperty(chai.Assertion.prototype, "always", function () {
        utils.flag(this, "always", true);
    });

    // "expected %n to have been called at least once but was never called",
    sinonProperty("called", "been called at least once", ", but it was never called");
    // ??
    sinonPropertyAsBooleanMethod("callCount", "been called %1", " but it was called %c%C");
    // "expected %n to be called once but was called %c%C",
    sinonProperty("calledOnce", "been called once", " but it was called %c%C");
    // "expected %n to be called twice but was called %c%C",
    sinonProperty("calledTwice", "been called twice", " but it was called %c%C");
    // "expected %n to be called thrice but was called %c%C",
    sinonProperty("calledThrice", "been called thrice", " but it was called %c%C");
    // "expected %n to be called with new"
    sinonMethodAsProperty("calledWithNew", "been called with new");
    // ??
    sinonMethod("calledBefore", "been called before %1");
    // ??
    sinonMethod("calledAfter", "been called after %1");
    // ??
    sinonMethod("calledImmediatelyBefore", "been called immediately before %1");
    // ??
    sinonMethod("calledImmediatelyAfter", "been called immediately after %1");
    // "expected %n to be called with %1 as this but was called with %t",
    sinonMethod("calledOn", "been called with %1 as this", " but it was called with %t");
    // "expected %n to be called with arguments %D",
    sinonMethod("calledWith", "been called with arguments %*", "%D");
    // ??
    sinonMethod("calledOnceWith", "been called once with arguments %*", "%D");
    // "expected %n to be called with exact arguments %D",
    sinonMethod("calledWithExactly", "been called with exact arguments %*", "%D");
    // "expected %n to be called once and with exact arguments %D",
    sinonMethod("calledOnceWithExactly", "been called once and with exact arguments %*", "%D");
    // "expected %n to be called with match %D",
    sinonMethod("calledWithMatch", "been called with match %*", "%D");
    sinonMethod("returned", "returned %1");
    exceptionalSinonMethod("thrown", "threw", "thrown %1");
}

export default sinonChai;
