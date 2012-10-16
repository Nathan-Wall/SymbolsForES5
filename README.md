SymbolsForES5
=============

Provides ECMAScript Harmony Symbols (Private Names) for ECMAScript 5.

This shim will check to see if the Symbol constructor already exists globally, and if not it will add it.
Should work in any ES5 compliant environment, browser or server.

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
