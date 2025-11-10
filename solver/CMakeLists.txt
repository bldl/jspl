cmake_minimum_required(VERSION 3.25)
project(spa-solver LANGUAGES CXX VERSION 1.0.0)

# --------------------------------------------------------------------------------------------------------
# Create Library
# --------------------------------------------------------------------------------------------------------

file(GLOB src "src/*.cpp")

add_executable(${PROJECT_NAME} ${src})
target_compile_features(${PROJECT_NAME} INTERFACE cxx_std_23)
set_target_properties(${PROJECT_NAME} PROPERTIES CXX_STANDARD 23 CXX_EXTENSIONS OFF CXX_STANDARD_REQUIRED ON)

# --------------------------------------------------------------------------------------------------------
# Setup Emscripten
# --------------------------------------------------------------------------------------------------------

set_target_properties(${PROJECT_NAME} PROPERTIES OUTPUT_NAME "solver")
target_link_options(${PROJECT_NAME} PRIVATE "SHELL:--emit-tsd \"${CMAKE_CURRENT_SOURCE_DIR}/wasm/solver.d.ts\"")
set_target_properties(${PROJECT_NAME} PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../public")

# --------------------------------------------------------------------------------------------------------
# Setup Includes
# --------------------------------------------------------------------------------------------------------

target_include_directories(${PROJECT_NAME} PUBLIC "include")

# --------------------------------------------------------------------------------------------------------
# Setup Dependencies
# --------------------------------------------------------------------------------------------------------

include("cmake/cpm.cmake")

CPMFindPackage(
  NAME           z3
  GIT_TAG        z3-4.15.3
  GIT_REPOSITORY "https://github.com/Z3Prover/z3"
)

target_link_libraries(${PROJECT_NAME} PRIVATE libz3 embind)
target_include_directories(libz3 INTERFACE $<BUILD_INTERFACE:${z3_SOURCE_DIR}/src/api/c++>)
