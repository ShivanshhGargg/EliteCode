package com.shivansh.EliteCode.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

public class HtmlToPlainText {
    public static String convert(String html) {
        if (html == null) return "";
        Document document = Jsoup.parse(html);
        document.select("pre, code").forEach(el -> el.prepend("\n").append("\n"));
        return document.body().text().replaceAll("\\s+", " ").trim();
    }
}