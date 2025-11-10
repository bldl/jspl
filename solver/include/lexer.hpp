#pragma once

#include "utils.hpp"

#include <cstdint>
#include <string_view>

namespace spa
{
    enum class token_type : std::uint8_t
    {
        eof,
        eq,
        lt,
        gt,
        leq,
        geq,
        neq,
        mult,
        plus,
        minus,
        literal,
        constant,
        lparen,
        rparen,
    };

    struct token
    {
        token_type type;
        std::string_view value;
    };

    class lexer
    {
        std::string_view m_source;

      public:
        lexer(std::string_view source);

      private:
        [[nodiscard]] char peek(std::size_t = 0) const;
        [[nodiscard]] std::string_view consume(std::size_t);

      private:
        res<char> expect(char, std::size_t = 0);

      private:
        res<token> literal();
        res<token> constant();

      public:
        res<token> next();
    };
} // namespace spa
