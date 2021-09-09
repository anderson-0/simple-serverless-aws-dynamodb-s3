import { document } from "src/utils/dynamodbClient";

interface ICreateCertificateDTO {
    id: string;
    name: string;
    grade: string;
}

export const handle = async (event) => {
    const {id, name, grade} = JSON.parse(event.body) as ICreateCertificateDTO;

    const response = await document.put({
        TableName: "users_certificates",
        Item:{
            id,
            name,
            grade
        }
    }).promise();

    return {
        statusCode: 201,
        body: JSON.stringify({
            response
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    };
}