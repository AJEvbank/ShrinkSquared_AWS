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

    console.log('GET query: ' + JSON.stringify(params));


    doc.scan(params, (err, data) => {
        if (err) { return errorResponse(context, 'Error:', err); }
        let i;
        let jsonStr = '{"Items":[]}';
        let obj = JSON.parse(jsonStr);
        for(i = 0; i < data.Count; i++) {
            const m = parseFloat(data.Items[i].quantity) * parseFloat(data.Items[i].unitPrice);

            obj['Items'].push({'upcId': data.Items[i].item.upc, 'name': data.Items[i].item.name, 'highRisk': data.Items[i].item.isHighRisk, 'totalShrink': m});
        }

        return successResponse(context, obj);
    });
}

function getUPCName(context, upcId){
    const params = {
        KeyConditionExpression: 'upcId = :key',
        ExpressionAttributeValues: { ':key': upcId },
        TableName: itemTable,

    };

    console.log('GET query: ' + JSON.stringify(params));

    doc.query(params, (err, data) => {
        if (err) { return errorResponse(context, 'Error', err); }
        console.log(data);
        return data;

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
