var express = require("express");
var router = express.Router();
const puppeteer = require("puppeteer");
const selector = {
  psList: "#print > div.h4_wrap.ma_t_5 > table > tbody > tr",
  postNum: "#print > table > tbody > tr > th",
  fromData: "#print > table > tbody > tr > td:nth-child(2)",
  toData: "#print > table > tbody > tr > td:nth-child(3)",
  postType: "#print > table > tbody > tr > td:nth-child(4)",
  status: "#print > table > tbody > tr > td:nth-child(5)",
};

router.post("/", async function (req, res, next) {
  const { postNum } = req.body;
  const dummyReq = "6117501167460";
  const url = `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${postNum}&displayHeader=N`;
  const payload = { progressList: [] };

  try {
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();
    // 크롤링 시작
    await page.goto(url);

    const progressListNum = await page.$$eval(
      selector.psList,
      (data) => data.length
    );

    for (let i = 1; i <= progressListNum; i++) {
      const dum = await progressItemExporter(page, i);
      payload.progressList.push(dum);
    }

    payload.postNum = await itemSelector(page, selector.postNum);

    const { from, fromDate } = await spNameAndDate(page, selector.fromData);

    payload.from = from;
    payload.fromDate = fromDate;

    const { to, toDate } = await spNameAndDateForTo(page, selector.toData);

    payload.to = to;
    payload.toDate = toDate;

    payload.postType = await itemSelector(page, selector.postType);
    payload.status = await itemSelector(page, selector.status);

    await browser.close();
    res.status(200).json({
      payload,
      type: "success",
      err: "no",
    });
  } catch (err) {
    res.json({
      payload: [],
      type: "fail",
      err,
    });
  }
});

module.exports = router;

const spNameAndDate = async (page, selector) => {
  const initData = {
    from: "",
    fromData: "",
  };
  try {
    const data = {};
    const items = await itemSelector(page, selector);
    if (items.length > 10) {
      data.from = items.substring(0, items.length - 10);
      data.fromDate = items.substring(items.length - 10, items.length + 1);
    } else {
      data.from = items;
      data.fromDate = "";
    }
    return data;
  } catch {
    return initData;
  }
};

const spNameAndDateForTo = async (page, selector) => {
  const initData = {
    to: "",
    toData: "",
  };
  try {
    const data = {};
    const items = await itemSelector(page, selector);

    if (items.length > 10) {
      data.to = items.substring(0, items.length - 10);
      data.toDate = items.substring(items.length - 10, items.length + 1);
    } else {
      data.to = items;
      data.toDate = "";
    }
    return data;
  } catch {
    return initData;
  }
};

const progressItemExporter = async (page, column) => {
  const initData = {
    date: "",
    time: "",
    office: "",
    status: "",
  };
  try {
    const selector = (i) => {
      return `#print > div.h4_wrap.ma_t_5 > table > tbody > tr:nth-child(${column}) > td:nth-child(${i})`;
    };
    const item = {};
    item.date = await itemSelector(page, selector(1));
    item.time = await itemSelector(page, selector(2));
    item.office = await itemSelector(page, selector(3));
    item.status = await itemSelectorForStatus(page, selector(4));
    return item;
  } catch {
    return initData;
  }
};

const itemSelector = async (page, selector) => {
  try {
    let item = await page.$eval(selector, (e) => {
      return e.textContent
        .replace(/\n/g, "")
        .replace(/\t/g, "")
        .replace(/ /g, "");
    });
    return item;
  } catch {
    return "";
  }
};

const itemSelectorForStatus = async (page, selector) => {
  try {
    let item = await page.$eval(selector, (e) => {
      const data = e.textContent
        .replace(/\n/g, "")
        .replace(/\t/g, "")
        .replace(/ /g, "");

      if (data.length > 4) {
        return data.substring(0, 4);
      } else {
        return data;
      }
    });
    return item;
  } catch {
    return "";
  }
};
