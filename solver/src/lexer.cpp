#include "lexer.hpp"

#include <format>
#include <unordered_set>

namespace spa
{
    static const auto special = std::unordered_set<char>{'*', '+', '-', '<', '>', '='};

    lexer::lexer(std::string_view source) : m_source(source) {}

    char lexer::peek(std::size_t offset) const
    {
        return offset < m_source.size() ? m_source[offset] : '\0';
    }

    std::string_view lexer::consume(std::size_t n)
    {
        auto rtn = m_source.substr(0, n);
        m_source = m_source.substr(n);
        return rtn;
    }

    res<char> lexer::expect(char c, std::size_t offset)
    {
        auto rtn = peek(offset);

        if (rtn != c)
        {
            return err{std::format("Expected '{}' but got '{}'", c, rtn)};
        }

        return rtn;
    }

    res<token> lexer::literal()
    {
        std::size_t len = 0;

        for (auto c = peek(); len == 0 ? std::isalpha(c) : std::isalnum(c);)
        {
            c = peek(++len);
        }

        if (!len)
        {
            return err{"Expected literal"};
        }

        return token{.type = token_type::literal, .value = consume(len)};
    }

    res<token> lexer::constant()
    {
        std::size_t len = 0;

        for (auto c = peek(); std::isdigit(c);)
        {
            c = peek(++len);
        }

        if (!len)
        {
            return err{"Expected number"};
        }

        return token{.type = token_type::constant, .value = consume(len)};
    }

    res<token> lexer::next()
    {
        while (!m_source.empty() && std::isspace(peek()))
        {
            std::ignore = consume(1);
        }

        if (m_source.empty())
        {
            return token{.type = token_type::eof, .value = {}};
        }

        switch (peek())
        {
            using enum token_type;

        case '*':
            return token{.type = mult, .value = consume(1)};
        case '+':
            return token{.type = plus, .value = consume(1)};
        case '-':
            return token{.type = minus, .value = consume(1)};
        case '(':
            return token{.type = lparen, .value = consume(1)};
        case ')':
            return token{.type = rparen, .value = consume(1)};
        case '>': {
            const auto len = 1 + (peek(1) == '=');
            return token{.type = len == 2 ? geq : gt, .value = consume(len)};
        }
        case '<': {
            const auto len = 1 + (peek(1) == '=');
            return token{.type = len == 2 ? leq : lt, .value = consume(len)};
        }
        case '=':
            return expect('=', 1).transform(bind_ignore([this] { return token{.type = eq, .value = consume(2)}; }));
        case '!':
            return expect('=', 1).transform(bind_ignore([this] { return token{.type = eq, .value = consume(2)}; }));
        }

        return constant().or_else(bind_ignore(&lexer::literal, this));
    }
} // namespace spa
