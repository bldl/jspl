#pragma once

#include <concepts>
#include <expected>

#include <memory>
#include <string>
#include <variant>

namespace spa
{
    template <typename T>
    using res = std ::expected<T, std::string>;
    using err = std::unexpected<std::string>;

    template <typename... Ts>
    using variant_ptr = std::variant<std::unique_ptr<Ts>...>;

    template <typename T, typename... Ts>
        requires std::invocable<T, Ts...>
    auto bind_ignore(T &&, Ts &&...);

    template <typename C, typename T, typename... Ts>
    auto bind_ignore(T (C::*)(Ts...), C *, Ts &&...);
} // namespace spa

#include "utils.inl"
