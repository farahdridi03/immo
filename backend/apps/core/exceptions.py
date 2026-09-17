from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Standardized API exception handler ensuring consistent JSON error responses across DRF APIs.
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "error": {
                "status_code": response.status_code,
                "type": exc.__class__.__name__,
                "details": response.data,
            }
        }
        response.data = custom_data
    else:
        # Handle unhandled server exceptions gracefully in production
        custom_data = {
            "success": False,
            "error": {
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "type": "InternalServerError",
                "details": "An unexpected error occurred on the server.",
            }
        }
        response = Response(custom_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
