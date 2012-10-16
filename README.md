SymbolsForES5
=============

Provides ECMAScript Harmony `Symbol`s (Private Names) for ECMAScript 5.

This shim will check to see if the Symbol constructor already exists globally, and if not it will add it.
Should work in any ES5 compliant environment, browser or server.

A nice way to go ahead and start working with `Symbol`s before they arrive in browsers, and to have code that will
work with `Symbol`s once they do arrive in browsers, provided they end up being named `Symbols` and have the same API
as the current draft.

This shim will be updated as the draft progresses.

Use:
----

    var Person = (function() {
        
        var firstName = new Symbol(),
            lastName = new Symbol();

        function Person(first, last) {
            this[firstName] = first;
            this[lastName] = last;
        }
    
        Person.prototype.getFullName = function() {
            return this[firstName] + ' ' + this[lastName];
        };

        return Person;

    })();

    var john = new Person('John', 'Smith');
    john.getFullName(); // => 'John Smith'

    Object.getOwnPropertyNames(john); // => [ ]

`Object.prototype.hasOwnProperty` has been overridden to support `object.hasOwnProperty(symbol)`.

    var x = { };
    var a = new Symbol();
    x[a] = 5;
    
    x[a]; // => 5
    x.hasOwnProperty(a); // => true

Symbols work on prototypes.

    var color = new Symbol();
    function A() { }
    A.prototype[color] = 'green';
    
    var x = new A();
    x[color]; // => 'green'
    x.hasOwnProperty(color); // => false

Symbols don't show up in `for...in` loops, `Object.keys`, or `Object.getOwnPropertyNames`.

    var x = { };
    var bar = new Symbol();
    x.foo = 27;
    x[bar] = 83;

    Object.getOwnPropertyNames(x); // => [ 'foo' ]
    x[bar]; // => 83