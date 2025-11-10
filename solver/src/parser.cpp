#include "parser.hpp"

#include <format>
#include <utility>

namespace spa
{
    parser::parser(std::string_view source) : m_lexer(source)
    {
        std::ignore = take();
    }

    bool parser::is(token_type type) const
    {
        return m_current && m_current->type == type;
    }

    res<token> parser::take()
    {
        auto rtn  = std::move(m_current);
        m_current = m_lexer.next();
        return rtn;
    }

    res<token> parser::take(token_type type)
    {
        if (!is(type))
        {
            return err{std::format("Expected <{}>", std::to_underlying(type))};
        }

        return take();
    }

    res<token> parser::take(std::initializer_list<token_type> allowed)
    {
        for (const auto &type : allowed)
        {
            auto rtn = take(type);

            if (!rtn)
            {
                continue;
            }

            return rtn;
        }

        // Emscriptens libc++ does not have std::views::join_with
        // yet, so we'll have to it the ugly way :/

        auto str = std::string{};

        for (const auto &type : allowed)
        {
            str += std::format("{},", std::to_underlying(type));
        }

        str.pop_back();

        return err{std::format("Expected one of <{}>", str)};
    }

    res<node> parser::primary()
    {
        if (auto tok = take(token_type::literal); tok)
        {
            return std::make_unique<spa::literal>(tok->value);
        }

        if (auto tok = take(token_type::constant); tok)
        {
            return std::make_unique<spa::constant>(tok->value);
        }

        return err{"Expected primary"};
    }

    res<node> parser::expr() // NOLINT(*-recursion)
    {
        using enum token_type;

        if (auto op = take(minus); op)
        {
            return expr().transform([op](node &&fac) { return std::make_unique<spa::unary>(op->type, std::move(fac)); });
        }

        if (!take(lparen))
        {
            return primary();
        }

        auto rtn = term();

        if (auto closing = take(rparen); !closing)
        {
            return err{closing.error()};
        }

        return rtn;
    }

    template <>
    struct parser::allowed_tokens<precedence::low>
    {
        static constexpr auto value = {token_type::minus, token_type::plus};
    };

    template <>
    struct parser::allowed_tokens<precedence::high>
    {
        static constexpr auto value = {token_type::mult};
    };

    template <>
    struct parser::next_precedence<precedence::low>
    {
        static constexpr auto value = &parser::term<precedence::high>;
    };

    template <>
    struct parser::next_precedence<precedence::high>
    {
        static constexpr auto value = &parser::expr;
    };

    template res<node> parser::term<precedence::low>();
    template res<node> parser::term<precedence::high>();

    template <precedence P>
    res<node> parser::term() // NOLINT(*-recursion)
    {
        using enum token_type;

        auto next = std::bind_front(next_precedence<P>::value, this);
        auto left = next();

        if (!left)
        {
            return left;
        }

        auto op = res<token>{};

        while ((op = take(allowed_tokens<P>::value)))
        {
            auto right = next();

            if (!right)
            {
                return right;
            }

            left = std::make_unique<spa::binary>(op->type, std::move(left.value()), std::move(right.value()));
        }

        return left;
    }

    res<node> parser::objective()
    {
        using enum token_type;

        auto rtn = term();

        if (auto res = take(eof); !res)
        {
            return err{res.error()};
        }

        return rtn;
    }

    res<node> parser::constraint()
    {
        using enum token_type;

        auto left = term();

        if (!left)
        {
            return left;
        }

        auto op = take({lt, gt, leq, geq, eq, neq});

        if (!op)
        {
            return err{op.error()};
        }

        auto right = term();

        if (!right)
        {
            return right;
        }

        if (auto res = take(eof); !res)
        {
            return err{res.error()};
        }

        return std::make_unique<spa::binary>(op->type, std::move(left.value()), std::move(right.value()));
    }
} // namespace spa
