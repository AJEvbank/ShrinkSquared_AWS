'use strict';

const AWS = require('aws-sdk');

const doc = new AWS.DynamoDB.DocumentClient();
const itemTable = process.env.ITEM_TABLE;

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

        }// else if (httpMethod === 'OPTIONS'){

        //}

    }
    return errorResponse(context, 'Unhandled http method:', httpMethod);

}

function handleItemsGET (event, context) {
    const params = {
        KeyConditionExpression: 'upcid = :key',
        ExpressionAttributeValues: { ':key': event.queryStringParameters.upcid },
        TableName: itemTable,

    };

    console.log('GET query: ' + JSON.stringify(params));

    doc.query(params, (err, data) => {
        if(err) { return errorResponse(context, 'Error:', err); }
        return successResponse(context, data);


    });

}

function handleItemsPUT (event, context){
    const upc = JSON.parse(event.body);
    //const upcid = getupcid(event.path);
    //if (!upc || !upcid ) { return errorResponse(context, 'Error: No upcid found') }
    const params = {
        TableName: itemTable,
        Key: { upcid: event.queryStringParameters.upcid },
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

//function getupcid (path) { return path.match(/upc\/(.*)/)[1] }

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
