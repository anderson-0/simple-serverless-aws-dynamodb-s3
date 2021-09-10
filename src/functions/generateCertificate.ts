import * as path from "path";
import {readFileSync} from "fs";
import { document } from "src/utils/dynamodbClient";
import * as handlebars from "handlebars";
import dayjs from "dayjs";

import chromium from "chrome-aws-lambda";

interface ICreateCertificateDTO {
    id: string;
    name: string;
    grade: string;
}

interface ITemplate {
    id: string;
    name: string;
    grade: string;
    date: string;
    medal: string;
}

const compile = async function(data: ITemplate){
    const filePath = path.join(process.cwd(), "src", "templates", "certificate.hbs")
    const html = readFileSync(filePath,'utf-8');
    
    return handlebars.compile(html)(data);
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

    const medalPath = path.join(process.cwd(), "src", "templates", "selo.png");
    const medal = readFileSync(medalPath, "base64");

    const data: ITemplate = {
        date: dayjs().format("DD/MM/YYYY"),
        grade,
        name,
        id,
        medal
    }

    const content = await compile(data);

    const browser = await chromium.puppeteer.launch({
        headless: true,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath
    })

    const page = await browser.newPage();
    
    await page.setContent(content);

    const pdf = await page.pdf({
        format: "a4",
        landscape: true,
        path: process.env.IS_OFFLINE ? "certificate.pdf" : null,
        printBackground: true,
        preferCSSPageSize: true,
    });

    await browser.close();

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