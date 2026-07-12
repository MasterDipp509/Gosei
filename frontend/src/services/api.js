// src/services/api.js

import axios from 'axios'


/* ==================================================
   API INSTANCE
================================================== */

const api = axios.create({

    baseURL:
        '/api',


    /* ==============================================
       DJANGO SESSION + CSRF COOKIES
    ============================================== */

    withCredentials:
        true,


    /*
      Axios can automatically read:

      csrftoken

      and send:

      X-CSRFToken
    */

    withXSRFToken:
        true,


    xsrfCookieName:
        'csrftoken',


    xsrfHeaderName:
        'X-CSRFToken',


    headers: {

        Accept:
            'application/json',

        'Content-Type':
            'application/json'
    }
})


/* ==================================================
   REQUEST INTERCEPTOR
================================================== */

api.interceptors.request.use(

    config => {

        return config

    },


    error => {

        return Promise.reject(
            error
        )
    }
)


/* ==================================================
   RESPONSE INTERCEPTOR
================================================== */

api.interceptors.response.use(

    response => {

        return response
    },


    error => {

        const response =
            error?.response


        const config =
            error?.config


        console.error(

            '[API ERROR]',

            {

                status:
                    response?.status
                    ??
                    0,


                response:
                    response?.data
                    ??
                    null,


                request:
                    config?.data
                    ??
                    undefined,


                url:
                    config?.url
                    ??
                    null
            }
        )


        const responseData =
            response?.data


        let message =
            'Something went wrong while contacting the server.'


        if (
            typeof responseData?.detail ===
            'string'
        ) {

            message =
                responseData.detail

        } else if (
            typeof responseData?.message ===
            'string'
        ) {

            message =
                responseData.message

        } else if (
            typeof responseData ===
            'string'

            &&

            !responseData
                .trim()
                .startsWith(
                    '<!DOCTYPE html>'
                )
        ) {

            message =
                responseData
        }


        const normalizedError =
            new Error(
                message
            )


        normalizedError.status =
            response?.status
            ??
            0


        normalizedError.data =
            responseData
            ??
            null


        normalizedError.request =
            config?.data
            ??
            undefined


        normalizedError.url =
            config?.url
            ??
            null


        normalizedError.originalError =
            error


        return Promise.reject(
            normalizedError
        )
    }
)


export default api
