#pragma once

#include "utils.hpp"

#include <utility>
#include <functional>

namespace spa
{
    template <typename C, typename T, typename... Ts>
    auto bind_ignore(T (C::*func)(Ts...), C *instance, Ts &&...params)
    {
        return [func, instance, ... params = std::forward<Ts>(params)]<typename... Ds>(Ds &&...) mutable
        {
            return std::invoke(func, instance, std::forward<Ts>(params)...);
        };
    }

    template <typename T, typename... Ts>
        requires std::invocable<T, Ts...>
    auto bind_ignore(T &&callable, Ts &&...params)
    {
        return [callable = std::forward<T>(callable), ... params = std::forward<Ts>(params)]<typename... Ds>(Ds &&...) mutable
        {
            return std::invoke(std::forward<T>(callable), std::forward<Ts>(params)...);
        };
    }
} // namespace spa
