'use strict';

const AWS = require('aws-sdk');
const axios = require('axios');

const doc = new AWS.DynamoDB.DocumentClient();
const itemTable = process.env.ITEM_TABLE;
const upcDBToken = process.env.UPCDB_TOKEN;

exports.handler = function (event, context, callback) {
    console.log('request: ' + JSON.stringify(event));
    handleHttpMethod(event, context);

};

function handleHttpMethod (event, context) {
    const httpMethod = event.httpMethod;

    if (event.path.match(/^\/upc/)) {
        if (httpMethod === 'GET') {
            return handleItemsGET(event, context);

        } else if (httpMethod === 'PUT') {
            return handleItemsPUT(event, context);

        }

    }
    return errorResponse(context, 'Unhandled http method:', httpMethod);

}

function handleItemsGET (event, context) {
    const params = {
        KeyConditionExpression: 'upcId = :key',
        ExpressionAttributeValues: { ':key': event.queryStringParameters.upcId },
        TableName: itemTable,

    };

    console.log('GET query: ' + JSON.stringify(params));

    doc.query(params, (err, data) => {
        console.log(data);
        if(err) { return errorResponse(context, 'Error:', err); }
        if (JSON.stringify(data.Count) == 0) { return upcDB(event, context); }
        return successResponse(context, data);

    });

}

function handleItemsPUT (event, context){
    const upc = JSON.parse(event.body);
    const params = {
        TableName: itemTable,
        Key: { upcId: event.queryStringParameters.upcId },
        UpdateExpression: 'set #a = :val1, #b = :val2',
        ExpressionAttributeNames: { '#a': 'name', '#b': 'highRisk' },
        ExpressionAttributeValues: { ':val1': upc.name, ':val2': upc.highRisk },
        ReturnValues: 'ALL_NEW'

    };

    console.log('Updating upc:', JSON.stringify(params));
    doc.update(params, (err, data) => {
        if(err) { return errorResponse(context, 'Error: Could not update upc', err.message) }
        return successResponse(context, {upc: data.Attributes});

    });

}

function upcDB(event, context){
    let url = 'https://api.upcdatabase.org/product/';
    url = url.concat(event.queryStringParameters.upcId).concat('/').concat(upcDBToken);

    axios
        .get(url)
        .then(response => {
            const params = {
                TableName: itemTable,
                Key: { upcId: event.queryStringParameters.upcId },
                UpdateExpression: 'set #a = :val1, #b = :val2',
                ExpressionAttributeNames: { '#a': 'name', '#b': 'highRisk' },
                ExpressionAttributeValues: { ':val1': response.data.title, ':val2': false },
                ReturnValues: 'ALL_NEW'

            };

            doc.update(params, (err, data) => {
                if(err) { return errorResponse(context, 'Error: Could not update upc', err.message); }
                console.log(data.Attributes);
            });

            const newResponse = { Items: [{ name: response.data.title, highRisk: false, upcId: event.queryStringParameters.upcId, fromUPCDB: true }] };
            return successResponse(context, newResponse);
        })
        .catch(error => {
            let response = '';

            console.log(error.response.data);

            if (JSON.stringify(error.response.data.status)=='404') {
                response = { statusCode: 200, body: JSON.stringify({'Items': '[{}]'}) };
                return context.succeed(response);

            } else {
                return context.succeed(error.response.data);

            }

        });

}

function errorResponse(context, logline){
    const response = { statusCode: 404, body: JSON.stringify({ 'Error': 'Could not execute request' }) };
    const args = Array.from(arguments).slice(1);

    console.log.apply(null, args);

    context.succeed(response);


}

function successResponse(context, body) {
    const response = { statusCode: 200, body: JSON.stringify(body), headers: { 'Access-Control-Allow-Origin': '*'  } };

    console.log('response: ' + JSON.stringify(response));

    context.succeed(response);


}
