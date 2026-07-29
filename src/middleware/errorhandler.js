export function errorHandler (error, request, response, next ) {
    console.error(error)

    const statusCode =error.statusCode || 500

    return response.status(statusCode).json({
        success : false,
        message:statusCode === 500 ? "an error occurred internal server contact Admin"
        : error.message,

        code: error.code || null,
    });
}