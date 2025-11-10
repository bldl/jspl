#include "emitter.hpp"

#include <utility>

namespace spa
{
    emitter::emitter(z3::context &ctx, variables &vars) : m_context(&ctx), m_variables(&vars) {}

    res<z3::expr> emitter::emit(binary &node)
    {
        auto left = emit(std::move(node.left));

        if (!left)
        {
            return left;
        }

        auto right = emit(std::move(node.right));

        if (!right)
        {
            return right;
        }

        switch (node.op)
        {
            using enum token_type;

        case mult:
            return left.value() * right.value();
        case plus:
            return left.value() + right.value();
        case minus:
            return left.value() - right.value();
        case lt:
            return left.value() < right.value();
        case gt:
            return left.value() > right.value();
        case leq:
            return left.value() <= right.value();
        case geq:
            return left.value() >= right.value();
        case eq:
            return left.value() == right.value();
        case neq:
            return left.value() != right.value();

        case eof:
            [[fallthrough]];
        case literal:
            [[fallthrough]];
        case constant:
            [[fallthrough]];
        case lparen:
            [[fallthrough]];
        case rparen:
            std::unreachable();
        }
    }

    res<z3::expr> emitter::emit(unary &node)
    {
        auto value = emit(std::move(node.value));

        if (!value)
        {
            return value;
        }

        switch (node.op)
        {
            using enum token_type;

        case minus:
            return -1 * value.value();

        default:
            std::unreachable();
        }
    }

    res<z3::expr> emitter::emit(literal &node)
    {
        auto var = m_variables->find(node.name);

        if (var == m_variables->end())
        {
            return err{std::format("No variable '{}'", node.name)};
        }

        return z3::ite(var->second, m_context->int_val(1), m_context->int_val(0));
    }

    res<z3::expr> emitter::emit(constant &node)
    {
        return m_context->int_val(std::string{node.value}.c_str());
    }

    res<z3::expr> emitter::emit(node node)
    {
        return std::visit([this](auto &&value) { return emit(*value); }, std::move(node));
    }
} // namespace spa
