from math import ceil

TWEAKABLES_IN_R_AND_T = 15
WANTED_TWEAKABLES = 1000

LAB_PREFIX = """
laboratory {
	title "Records and Tuples Laboratory 🔬"
	description MD "🏗 Work in progress - [raise technical issue](https://github.com/acutmore/record-tuple-laboratory/issues/new)"
	icon "./res/favicon.svg"
	author "Ashley Claymore"
	format HTML
	version "2"
}

issue withoutBox {
    summary 
        "complexity moved to ecosystem"
    description 
		"<p>Without a 'Box' like type there will not be any direct support in the language for storing objects in Records and Tuples.</p>
		Instead using <a href=\\\"https://github.com/tc39/proposal-symbols-as-weakmap-keys\\\">symbols-as-weakmap-keys</a>,
		symbols in Record and Tuples could still refer to objects/functions via a WeakMap.
		Code will need to ensure the necessary code has access to these WeakMap side tables.
		APIs conventions will need to be established to distinguish when symbols are being used in this way.
		Care will need to be taken with the WeakMaps, if a Map is used by accident there is a risk of memory leaks.
		Unless direct access to the WeakMap is hidden behind a wrapper, other code could remove/replace the referenced
		object.
		<p>
			Box use-cases include:
			<ul>
				<li>Composite keys for Maps/Sets.</li>
				<li>
					In React.js creating and passing groups of values, possibly functions,
					around without triggering re-renders due to changing object identity
				</li>
			</ul>
		</p>"
}

issue typeofPowerfulObjectIsNotObject {
	summary
		"security risk"
	description
		"Existing security sensitive code checks if a value has no-power by checking if it's typeof
		is not 'object' or 'function', and will assume values with other results are safe to
		pass-around without further inspection. These projects may not be updated before they start
		to interact with Records and Tuples."
}

issue validWeakValue {
	summary
		"consistency change"
	description
		"Current code can rely on the consistency that values that have typeof 'object' and are not
		null can be stored weakly. If R&T introduces values that have typeof 'object' but throw when
		placed in a WeakSet this consistency is no longer reliable. And code will need to be updated."
}

issue weakSetLeak {
	summary 
		"memory leak"
	description
		"If values are allowed in a WeakSet that are impossible to be garbage-collected this could
		create a silent memory leak."
}

issue slotSensitiveTypeof {
	summary
		"slot sensitive typeof"
	description
		"If typeof a record or tuple changes depending on if there is a box transitively within its
		tree this makes typeof confusing. Code will have to rely on static methods like
		Record.isRecord instead."
}

issue confusingTypeof {
	summary
		"problematic typeof"
	description
		"If a Tuple without a Box in it's tree has typeof 'object', there is no value to be gained
		from a Tuple with a Box having typeof 'tuple', because if anything it is more like an object
		when it contains a Box."
}

issue objectWrappers {
	summary
		"object wrappers"
	description
		"<p>If Records and Tuples are not objects then a <pre>ToObject</pre> operation will return an object wrapper
		which will have its own unique identity: <pre>Object(#[]) !== Object(#[])</pre></p>."
}

issue objectWrapperInConsistency {
	summary
		"being objects"
	description
		"<p>Code may assume that if a value's typeof is not 'object' or 'function' then it is not an object, but if <pre>ToObject</pre> returns the value as is this implies that it is an object.</p>
		<p>If Tuples are objects this means that the methods on their '[[prototype]]' will be linked to the realm (e.g. iframe) in which they were created.
			As opposed to primitives, where property access triggers a <pre>ToObject</pre> in the current executing realm.
			This would mean that two Tuples created in different realms will carry around different prototypes.
			The choice here is that either two objects with different prototypes can still be === equal to each other.
			Or Tuples from different realms are never equal even if their contents are equal.
		</p>"
}

issue noBoxesInWeakSets {
	summary
		"performance"
	description
		"Libraries may want to create values based on Records that contain boxes. For example,
		mapping over a record and mapping each Box to something else. If this work is expensive, it
		may be beneficial to memoize the work using a WeakMap. But this wouldn't be possible if
		Records with Boxes can't be WeakMaps keys."
}

issue unequalTupleNan {
	summary
		"consistency change"
	description
		"Currently the only value not equal to itself is NaN, and this can be used as a reliable
		check for NaN. If any record or tuple containing a NaN within its tree is also not equal to
		itself, then there would be an infinite number of values not equal to themselves.
		<ul>
			<li>
				<a href=\\\"https://github.com/tc39/proposal-record-tuple/issues/65\\\"
					>R&T #65 Equality semantics for -0 and NaN</a
				>
			</li>
		</ul>"
}

issue noNegativeZero {
	summary	
		"no negative zero"
	description
		"<p>
			Negative zero can be stored in a standard Array. If negative zero was transformed into
			positive zero when stored in a tuple, then mapping arrays of numbers to and from tuples
			would not be isomorphic.
		</p>
		<p>Being able to store a negative zero is considered important to some users.</p>
		<ul>
			<li>
				<a href=\\\"https://github.com/tc39/proposal-record-tuple/issues/65\\\"
					>R&T #65 Equality semantics for -0 and NaN</a
				>
			</li>
		</ul>"
}

issue impossibleEqualityOfZeros {
	summary
		"impossible equality"
	description
		"If negative zero can not be stored in a Tuple (converted to +0). Then #[-0] cannot compare
		unequal to #[+0]."
}

issue observableDifferentButIsEqual {
	summary
		"Object.is semantics"
	description
		"Putting aside that two NaNs can be observably different, by storing them in a TypedArray and
		reading the bits. If Object.is returns true for two values this means the two values are not
		observably different, this is useful for memoization techniques. For a pure function, if the
		inputs have not changed in an observable way then neither should the output. React.js for
		example uses Object.is for its change-detection. If two Tuples compare equal, but have
		observably different values (one has positive zero and the other has negative zero), then
		this changes the semantics of Object.is, and the use cases it can be applied to."
}

issue nanNotIsNan {
	summary
		"Object.is NaN semantics"
	description
		"if both 'Object.is(NaN, NaN)' and '#[NaN] === #[NaN]'' are true, there does not appear to be
		a reason for Object.is(#[NaN], #[NaN]) to not be true."
}

issue canNotAlwaysIntern {
	summary
		"can not always intern"
	description
		"Object interning is a technique used to reduce memory and speed up certain operations after
		the initial interning cost. If #[+0] equals #[-0] and storing negative zero in a tuple is
		preserved then records and tuple equality can not solely rely on interning."
}

issue zerosNotTripleEqual {
	summary
		"Triple equality semantics"
	description
		"As -0 === +0 on their own, it may surprise people that they are no longer treated as triple
		equal when compared via a record or tuple. This could lead to bugs.
		<ul>
			<li>
				<a href=\\\"https://github.com/tc39/proposal-record-tuple/issues/65\\\"
					>R&T #65 Equality semantics for -0 and NaN</a
				>
			</li>
		</ul>"
}

issue storingPrimitiveInBox {
	summary
		"storing <i>primitives*</i> in a Box"
	description
		"<p>
			primitives*: For want of a more appropriate term, in this section the term primitive will have the meaning: a value that can be directly stored in a Record or Tuple.
			i.e. records, tuples, boxes, null, undefined, booleans, numbers, strings, symbols, and bigints.
		</p>
		<p>
			The original rationale for introducing Box is to allow Records and Tuples to explicitly reference a value that would otherwise be disallowed
			to be 'stored' directly within Records and Tuples e.g. functions.
			Values like numbers can already be stored in a Record or Tuple.
			While allowing primitives* to be stored in a Box may be ergonomic for the producer of the Box,
			complexity has been moved to the consumers of Boxes. Consumers can no longer rely on the guarantee that a Box will always
			reference a 'non-primitive*'.
		</p>
		<p>
			It appears that there might be situations where checking if a Record contains an Object or not will be important, because of the difference in semantics.
			e.g. checking for cycles, passing values across a <a href=\\\"https://github.com/tc39/proposal-shadowrealm\\\">ShadowRealm</a> boundary,
			or <a href=\\\"https://github.com/tc39/proposal-record-tuple/issues/233#issuecomment-895044432\\\">storing values in a WeakMap</a>.
			If primitives* can be stored in a Box, then code checking if a Record/Tuple transitively contains an Object can no
			longer be performed with a single call to a <pre>Box.containsBoxes</pre> predicate, instead different/additional helpers would be needed for this use-case.
			e.g. <pre>Object.containsObject</pre> or <pre>Box.containsBoxWithIdentity</pre>. These helpers <i>may</i> be harder to explain than 'containsBoxes'.
			Note: These helpers can be implemented in user-land, recursively walking the tree inspecting the values. They do not necessarily need to be built-in.
		</p>
		<ul>
			<li><a href=\\\"https://github.com/tc39/proposal-record-tuple/issues/238\\\">R&T #238 Behavior of Box(Box(x))</a></li>
			<li><a href=\\\"https://github.com/tc39/proposal-record-tuple/issues/231\\\">R&T #231 Boxes: How to expose a way to detect boxes in R&T?</a></li>
		</ul>"
}

issue noPrimitivesInBox {
	summary
		"Box construction ergonomics"
	description
		"If the Box constructor throws for values that can be 'stored' directly in a Record and
		Tuple, such as strings, numbers, booleans. This adds complexity for code that is trying to
		use Boxes generically, they will now need to check if a value can be put in a Box before
		attempting to construct the Box, or be sure to handle the possibility that an exception will
		be thrown. From a different perspective there could be an advantage to an exception being
		thrown - it <i>may</i> help clarify the purpose of Boxes and make unnecessary boxing
		impossible."
}

issue recordProxies {
	summary
		"Record proxies"
	description
		"It appears that a Record-Proxy would not be able to be much different from 'new
		Proxy(Object.freeze({...record}), handler)'. This is because if the Proxy still retained
		Record semantics, then equality checks would need to trigger the traps. Causing arbitrary JS
		to run during previously safe operations like '==='. This means that the returning proxy can
		not be transparent, and will instead be an object and not a record. It could be better to
		throw instead so this API space remains open for new ideas on how to achieve this in the
		future."
}

issue proxyThrowTypeofObject {
	summary
		"proxy ergonomics"
	description
		"Usually if something has typeof 'object' then it would be safe to create a proxy of it. But
		if records and tuples are typeof 'object' and throw when passed to the proxy constructor,
		this causes users to update their code to manually convert Records/Tuples into their frozen
		object counterparts before passing them to the proxy constructor."
}

issue differenceBetweenEqualityForTypeofObject {
	summary
		"different equality of an object-like value"
	description
		"<p>
			In current JavaScript if two values, 'a' and 'b', both have typeof 'object' then 'a ===
			b' and 'Object.is(a, b)' will always return the same result.
		</p>
		<p>
			The current laboratory setup would mean that this is no longer an invariant of the
			language. Because given two almost identical tuples, except one has positive zero, and
			the other has negative zero. These would both have typeof 'object' and be '===' equal to
			each other, but not equal when compared by Object.is.
		</p>"
}

issue boxType {
	summary
		"Box type"
	description
		"<p>
			Introducing a Box type to the language adds more complexity to the language.
		</p>"
}

issue objectsDontHaveWrappers {
	summary
		"Value is already an object"
	description
		"<p>
			If Records and Tuples are objects then <pre>ToObject</pre> should be an identity function.
		</p>"
}

issue tuplePrototypeEquality {
	summary
		"Tuple prototype equality"
	description
		"<p>
			Records do not have a '[[prototype]]', it is null. Tuples on the other hand do have a '[[prototype]]', being lists they
			can have many of the typical generic list operations (e.g. map, filter etc).
			In fact Tuples have all the same non-mutating methods as Arrays.
		</p>
		<p>
			If Tuples are objects this means that the methods on their '[[prototype]]' will be linked to the realm (e.g. iframe) in which they were created.
			As opposed to primitives, where property access triggers a <pre>ToObject</pre> in the current executing realm.
			This would mean that two Tuples created in different realms will carry around different prototypes.
			The choice here is that either two objects with different prototypes can still be === equal to each other.
			Or Tuples from different realms are never equal even if their contents are equal.
		</p>"
}"""

LAB_TWEAKABLES_TEMPLATE = """\
tweakable typeofArray{lab_index} {{
    expression "typeof []"
    default value "object"
}}

tweakable typeofNan{lab_index} {{
    expression "typeof NaN"
    default value "number"
}}

tweakable zeroTripleEqualsNegativZero{lab_index} {{
    expression "+0 === -0"
    default value true
}}

tweakable zeroObjectIsNegativeZero{lab_index} {{
    expression "Object.is(+0, -0)"
    default value false
}}

tweakable arrayWithNegativeZeroIncludesZero{lab_index} {{
    expression "[-0].includes(+0)"
    default value true 
}}

tweakable nanTripleEqualsNan{lab_index} {{
    expression "NaN === NaN"
    default value false
}}

tweakable nanObjectIsNan{lab_index} {{
    expression "Object.is(NaN, Nan)"
    default value true
}}

tweakable arrayWithNanIncludesNan{lab_index} {{
    expression "[NaN].includes(NaN)"
    default value true
}}

tweakable arrayWithZeroTripleEqualsArrayWithZero{lab_index} {{
    expression "[0] === [0]"
    default value false
}}

tweakable tupleWithZeroTripleEqualsTupleWithZero{lab_index} {{
    expression "#[0] === #[0]"
    default value true 
}}

tweakable objectIsFrozenTupleWithZero{lab_index} {{
    expression "Object.isFrozen(#[0])"
    default value true
}}

/*
    Tweakables
*/

tweakable storeNegativeZero{lab_index} {{
    expression "Object.is(#[-0].at(0), -0)"
    default value true 
    value false {{
        raise noNegativeZero
    }}
}}

tweakable zerosAreTripleEqual{lab_index} {{
    expression "#[+0] === #[-0]"
    default value true {{
        raise canNotAlwaysIntern when storeNegativeZero{lab_index} is true
    }}
    value False {{
        raise zerosNotTripleEqual when storeNegativeZero{lab_index} is true
        raise impossibleEqualityOfZeros when storeNegativeZero{lab_index} is false
    }}
}}

tweakable tupleNaNAreTripleEqual{lab_index} {{
    expression "#[NaN] === #[NaN]"
    default value true
    value false {{
        raise unequalTupleNan
    }}
}}

tweakable tupleWithZeroObjectIsTupleWithNegativeZero{lab_index} {{
    expression "Object.is(#[+0], #[-0])"
    default value false {{
        raise impossibleEqualityOfZeros when storeNegativeZero{lab_index} is false
        raise differenceBetweenEqualityForTypeofObject when typeofTuple{lab_index} is "object" and zerosAreTripleEqual{lab_index} is true
    }}
    value true {{
        raise observableDifferentButIsEqual when storeNegativeZero{lab_index} is true
    }}
}}

tweakable tupleWithNanObjectIsTupleWithNan{lab_index} {{
    expression "Object.is(#[NaN], #[NaN])"
    default value true
    value false {{
        raise nanNotIsNan when tupleNaNAreTripleEqual{lab_index} is true
    }}
}}

tweakable typeofTuple{lab_index} {{
    expression "typeof #[]"
    default value "tuple" {{
        raise slotSensitiveTypeof when typeOfTupleWithBox{lab_index} is "tuple" and typeofBoxConstructor{lab_index} is "function"
    }}
    value "object" {{
        raise slotSensitiveTypeof when typeOfTupleWithBox{lab_index} is "object" and typeofBoxConstructor{lab_index} is "function"
        raise tuplePrototypeEquality
    }}
}}

tweakable tupleWrappedInObjectTripleEqualsTuple{lab_index} {{
    expression "Object(#[]) === #[]"
    default value false {{
        raise objectsDontHaveWrappers when typeofTuple{lab_index} is "object"
        raise objectWrappers
    }}
    value true {{
        raise objectWrapperInConsistency when typeofTuple{lab_index} is "tuple"
    }}
}}

tweakable addingTupleToWeakSetThrows{lab_index} {{
    expression "new WeakSet().add(#[])"
    default value "ShouldThrow" {{
        raise validWeakValue when typeofTuple{lab_index} is "object"
    }}
    value "ShouldSucceed" {{
        raise weakSetLeak
    }}
}}

tweakable tupleAsArgumentOfNewProxyThrows{lab_index} {{
    expression "new Proxy(#[])"
    default value "ShouldThrow" {{
        raise proxyThrowTypeofObject when typeofTuple{lab_index} is "object"
    }}
    value "ShouldSucceed" {{
        raise recordProxies
    }}
}}

tweakable typeofBoxConstructor{lab_index} {{
    expression "typeof Box"
    default value "undefined" {{
        raise withoutBox 
    }}
    value "function" {{
        raise boxType
    }}
}}

tweakable typeofBoxInstance{lab_index} {{
    expression "typeof Box({{}})"
    default value "box" {{
        raise typeofPowerfulObjectIsNotObject
    }}
    value "object"
    disabled {{
        message "typeof Box === 'undefined'" when typeofBoxConstructor{lab_index} is "undefined"
    }}
}}

tweakable typeOfTupleWithBox{lab_index} {{
    expression "typeof #[Box({{}})]"
    default value "tuple" {{
        raise confusingTypeof when typeofTuple{lab_index} is "object"
        raise typeofPowerfulObjectIsNotObject when typeofBoxInstance{lab_index} is "object"
    }}
    value "object" 
    disabled {{
        message "typeof Box === 'undefined'" when typeofBoxConstructor{lab_index} is "undefined"
    }}
}}

tweakable boxConstructorWithPrimitives{lab_index} {{
    expression "Box(42)"
    default value "ShouldThrow" {{
        raise noPrimitivesInBox
    }}
    value "ShouldSucceed" {{
        raise storingPrimitiveInBox
    }}
    disabled {{
        message "typeof Box === 'undefined'" when typeofBoxConstructor{lab_index} is "undefined"
    }}
}}

tweakable addingTuplesWithBoxesToWeakSets{lab_index} {{
    expression "new WeakSet().add(#[Box({{}})])"
    default value "ShouldThrow" {{
        raise noBoxesInWeakSets
    }}
    value "ShouldSucceed"
    disabled {{
        message "typeof Box === 'undefined'" when typeofBoxConstructor{lab_index} is "undefined"
    }}
}}

tweakable tupleWithBoxAsArgumentForNewProxy{lab_index} {{
    expression "new Proxy(#[Box({{}})])"
    default value "ShouldThrow" {{
        raise proxyThrowTypeofObject when typeOfTupleWithBox{lab_index} is "object"
    }}
    value "ShouldSucceed" {{
        raise recordProxies
    }}
    disabled {{
        message "typeof Box === 'undefined'" when typeofBoxConstructor{lab_index} is "undefined"
    }}
}}
"""

with open("./lab.jspl", 'w') as output:
    output.write(LAB_PREFIX)

    randt_copies = ceil(WANTED_TWEAKABLES / TWEAKABLES_IN_R_AND_T)
    total_tweakables = randt_copies * TWEAKABLES_IN_R_AND_T

    print(f"Duplicating R&T {randt_copies} times, resulting in {total_tweakables} Tweakables.")

    for i in range(randt_copies):

        output.write(LAB_TWEAKABLES_TEMPLATE.format(lab_index = str(i)))