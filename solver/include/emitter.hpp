#pragma once

#include "parser.hpp"

#include <z3++.h>
#include <unordered_map>

namespace spa
{
    // While the whole parser for expressions here is rather overkill, it would allow to
    // easily swap out z3 with scip in the future if desired (scip does not work well with wasm though).
    // Furthermore, we have the added benefit of allowing more complicated expressions later on.

    // NOTE: The z3 optimizer does not like multiplications on boolean constants.
    //       This should be implemented with multiple constraints instead.

    struct emitter
    {
        using variables = std::unordered_map<std::string_view, z3::expr>;

      private:
        z3::context *m_context;
        variables *m_variables;

      public:
        emitter(z3::context &, variables &);

      private:
        res<z3::expr> emit(binary &);
        res<z3::expr> emit(unary &);
        res<z3::expr> emit(literal &);
        res<z3::expr> emit(constant &);

      public:
        res<z3::expr> emit(node);
    };
} // namespace spa
