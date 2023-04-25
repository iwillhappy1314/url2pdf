const puppeteer = require("puppeteer");
const {PDFDocument} = require("pdf-lib");
const fs = require("fs/promises");
const path = require('path');
const Koa = require('koa');
const app = new Koa();
const extname = path.extname;
const router = require('@koa/router')();
const send = require('koa-send');
const crypto = require('crypto');
const md5 = crypto.createHash('md5');

app.use(router.routes());

router.get('/', generate);

async function generate(ctx) {
    const query = ctx.request.query;
    let filename = await generatePDF(query.url);

    const fpath = path.join('data/' + filename);

    ctx.set('Content-disposition', 'attachment;filename=' + filename);
    ctx.set('Content-type', 'application/pdf');

    ctx.attachment(fpath);
    await send(ctx, fpath);
}

app.listen(3030);

async function generatePDF(url) {
    console.log(url);
    const browser = await puppeteer.launch({
        args: ["--disable-edv-shm-usage", "--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 0,
    });
    const option = {
        format: "A4",
        printBackground: true,
        "-webkit-print-color-adjust": "exact",
    };
    // 首先渲染出1，2封面页和最后一个背景，这里就是把最后一页背景挪到前面来和首页用同一种规则渲染。后面再合并到尾页去
    const cover = await page.pdf({
        ...option,
        pageRanges: "1-2",
    });

    await page.addStyleTag({
        content: ".page {display:none}",
    });

    const content = await page.pdf({
        ...option,
        displayHeaderFooter: false,
        margin: {
            top: "80px",
            bottom: "80px",
        },
    });

    const pdfDoc = await PDFDocument.create();

    const coverDoc = await PDFDocument.load(cover);

    const [coverPage] = await pdfDoc.copyPages(coverDoc, [0]);

    const [bgPage] = await pdfDoc.copyPages(coverDoc, [1]);

    pdfDoc.addPage(coverPage);

    const mainDoc = await PDFDocument.load(content);

    for (let index = 0; index < mainDoc.getPageCount(); index++) {
        const [mainPage] = await pdfDoc.copyPages(mainDoc, [index]);
        pdfDoc.addPage(mainPage);
    }

    pdfDoc.addPage(bgPage);

    const pdfBytes = await pdfDoc.save();

    let filename = md5.update(url).digest('hex') + '.pdf';

    await fs.writeFile("./data/" + filename, pdfBytes);

    await browser.close();

    return filename;
}