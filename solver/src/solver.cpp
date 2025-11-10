#include "emitter.hpp"

#include <map>
#include <vector>
#include <string>

#include <emscripten/bind.h>

struct input
{
    std::string objective;

  public:
    std::vector<std::string> variables;
    std::vector<std::string> constraints;
};

struct output
{
    bool success;
    std::string message;

  public:
    std::map<std::string, bool> variables;
};

output solve(const input &inp)
{
    using namespace spa;

    auto ctx = z3::context{};
    auto opt = z3::optimize{ctx};
    auto var = emitter::variables{};

    for (const auto &name : inp.variables)
    {
        var.emplace(name, ctx.bool_const(name.c_str()));
    }

    auto emt = emitter{ctx, var};

    for (const auto &constraint : inp.constraints)
    {
        auto parsed = parser{constraint}.constraint();

        if (!parsed)
        {
            return {
                .success = false,
                .message = parsed.error(),
            };
        }

        auto expr = emt.emit(std::move(parsed.value()));

        if (!expr)
        {
            return {
                .success = false,
                .message = expr.error(),
            };
        }

        opt.add(expr.value());
    }

    auto parsed = parser{inp.objective}.objective();

    if (!parsed)
    {
        return {
            .success = false,
            .message = parsed.error(),
        };
    }

    auto objective = emt.emit(std::move(parsed.value()));

    if (!objective)
    {
        return {
            .success = false,
            .message = objective.error(),
        };
    }

    opt.minimize(objective.value());

    if (opt.check() != z3::sat)
    {
        return {
            .success = false,
            .message = "unsat",
        };
    }

    auto model = opt.get_model();
    auto rtn   = output{.success = true};

    for (const auto &[name, value] : var)
    {
        rtn.variables.emplace(name, model.eval(value).is_true());
    }

    return rtn;
}

EMSCRIPTEN_BINDINGS(solver)
{
    emscripten::register_vector<std::string>("VecString");
    emscripten::register_map<std::string, bool>("MapVariables");

    emscripten::value_object<input>("Input")
        .field("objective", &input::objective)
        .field("variables", &input::variables)
        .field("constraints", &input::constraints);

    emscripten::value_object<output>("Output")
        .field("success", &output::success)
        .field("message", &output::message)
        .field("variables", &output::variables);

    emscripten::function("solve", solve);
}
