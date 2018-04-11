'use strict';

const AWS = require('aws-sdk');

const doc = new AWS.DynamoDB.DocumentClient();
const itemTable = process.env.ITEM_TABLE;
const taTable = process.env.AWAY_TABLE;

exports.handler = (event, context, callback) => {
    console.log('request: ' + JSON.stringify(event));
    handlehttpMethod(event, context);
};

function handlehttpMethod(event, context) {
    const httpMethod = event.httpMethod;

    if (event.path.match(/^\/shrink/)) {
        if (httpMethod == 'GET'){
            return handleShrinkGET(event, context);
        }
    }
   return errorResponse(context, 'Unhandled htto method:', httpMethod);

}

function handleShrinkGET(event, context){
    const params = {
        TableName: taTable,
    };

    let dataBody = {};

    doc.scan(params, (err, data) => {
        if(err) { return errorResponse(context, 'Error from DynamoDB:', err); }
        dataBody = data;

    }).on('error', function(error){
        return errorResponse(context, 'Error from AWS.Request:', error);

    }).on('complete', function(response){
        console.log(dataBody.Count);
        //return getItemInfo(context, dataBody.Items, dataBody.Count);
        return successResponse(context, dataBody.Items)

    });

}

function getItemInfo(context, items, count){
    //console.log(items);
    //console.log(count);
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
