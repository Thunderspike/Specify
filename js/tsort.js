/*
 * jQuery Animated Table Sorter 0.2.1 (01/30/2013)
 *
 * http://www.matanhershberg.com/plugins/jquery-animated-table-sorter/
 *
 */

(function (a) {
    a.fn.tableSort = function (q) {
        var b = a.extend(
            {
                animation: "slide",
                rowspan: !1,
                sortAs: {},
                speed: 300,
                distance: "300px",
                delay: 1,
            },
            q
        );
        return this.each(function () {
            function q(b) {
                for (var c = "", d = 0; d <= b.length; d++)
                    if (a.isNumeric(b.charAt(d)) || "." == b.charAt(d))
                        c += b.charAt(d);
                return c;
            }
            var f = [],
                m = [],
                k = !1,
                n = [],
                j = [],
                p = [],
                l = [],
                e,
                c = a(this),
                k = !1;
            !0 == b.rowspan &&
                a(c)
                    .find("td")
                    .each(function () {
                        if (void 0 != a(this).attr("rowspan")) {
                            var b = a(this).attr("rowspan");
                            a(this).removeAttr("rowspan");
                            for (
                                var c = a(this).parent().index(), d = 1;
                                1 < b;

                            ) {
                                switch (a(this).index()) {
                                    case 0:
                                        a(this)
                                            .clone()
                                            .prependTo(
                                                a(this)
                                                    .parent()
                                                    .parent()
                                                    .children()
                                                    .eq(c + d)
                                            );
                                        break;
                                    default:
                                        a(this)
                                            .clone()
                                            .insertAfter(
                                                a(this)
                                                    .parent()
                                                    .parent()
                                                    .children()
                                                    .eq(c + d)
                                                    .children()
                                                    .eq(a(this).index() - 1)
                                            );
                                }
                                d++;
                                b--;
                            }
                        }
                    });
            0 >= b.delay && (b.delay = 1);
            a(c)
                .find("tr:first-child th")
                .each(function (h) {
                    if (void 0 != b.sortBy)
                        switch (b.sortBy[h]) {
                            case "text":
                            case "numeric":
                            case "nosort":
                                l[h] = b.sortBy[h];
                                return;
                        }
                    if (void 0 != a(this).attr("data-sort"))
                        switch (a(this).attr("data-sort")) {
                            case "text":
                            case "numeric":
                            case "nosort":
                                l[h] = a(this).attr("data-sort");
                                return;
                        }
                    for (
                        var f = a(c)
                                .find("tr:eq(1) td:eq(" + h + ")")
                                .text(),
                            d = 0,
                            g = 0,
                            e = 0;
                        e <= f.length - 1;
                        e++
                    )
                        a.isNumeric(f.charAt(e)) ||
                        "," == f.charAt(e) ||
                        "." == f.charAt(e)
                            ? d++
                            : g++;
                    l[h] = d > g ? "numeric" : "text";
                });
            a(c).css("position", "relative");
            a(c)
                .find("tr:first-child th")
                .each(function (b) {
                    "nosort" != l[b] &&
                        a(
                            '<div class="sortArrow"><div class="sortArrowAscending"></div><div class="sortArrowDescending"></div></div>'
                        ).appendTo(a(this));
                });
            a(c)
                .find("tr:first-child th")
                .each(function () {
                    p.push(a(this).outerWidth(!0));
                });
            //   console.log({ p });
            a(c)
                .find("tr td, tr th")
                .each(function () {
                    a(this).css({
                        minWidth: p[a(this).index()],
                    });
                });
            a(c)
                .find("tr")
                .each(function () {
                    a(this).width(a(this).outerWidth(!0));
                    a(this).height(a(this).outerHeight(!0));
                });
            a(c).height(a(this).outerHeight()).width(a(this).outerWidth());
            var g = 0;
            a(c)
                .find("tr")
                .each(function () {
                    a(this).css("top", g);
                    g += a(this).outerHeight();
                });
            a(c)
                .find("tr")
                .each(function () {
                    a(this).css("position", "absolute");
                });
            a(c)
                .find("tr th")
                .each(function (b) {
                    "nosort" != l[b] && a(this).css("cursor", "pointer");
                });
            a(c)
                .find("tr th")
                .click(function () {
                    if (!k && "nosort" != l[a(this).index()]) {
                        e = a(this).index();
                        0 == f.length &&
                            a(c)
                                .find("tr")
                                .each(function (d) {
                                    0 < d &&
                                        a(this).addClass("tsort_id-" + (d - 1));
                                    a(this)
                                        .find("td")
                                        .each(function (c) {
                                            a(this).is(":first-child") &&
                                                (f.push({}),
                                                (f[f.length - 1].id = d - 1),
                                                (f[f.length - 1].td = []),
                                                (f[f.length - 1].height = a(
                                                    this
                                                )
                                                    .parent()
                                                    .height()));
                                            void 0 !=
                                            a(this).attr("data-sortAs")
                                                ? f[f.length - 1].td.push(
                                                      a(this).attr(
                                                          "data-sortAs"
                                                      )
                                                  )
                                                : void 0 != typeof b.sortAs &&
                                                  void 0 !=
                                                      b.sortAs[a(this).text()]
                                                ? f[f.length - 1].td.push(
                                                      b.sortAs[a(this).text()]
                                                  )
                                                : "numeric" == l[c]
                                                ? f[f.length - 1].td.push(
                                                      q(a(this).text())
                                                  )
                                                : f[f.length - 1].td.push(
                                                      a(this).text()
                                                  );
                                        });
                                });
                        n[e] ||
                            ((n[e] = f.concat()),
                            "numeric" == l[e]
                                ? n[e].sort(function (a, b) {
                                      return a.td[e] - b.td[e];
                                  })
                                : "text" == l[e] &&
                                  n[e].sort(function (a, b) {
                                      return a.td[e].localeCompare(b.td[e]);
                                  }));
                        if (0 == j.length)
                            j.push({
                                column_id: e,
                                direction: "ascending",
                            });
                        else if (0 != j.length)
                            if (e == j[j.length - 1].column_id)
                                switch (j[j.length - 1].direction) {
                                    case "ascending":
                                        j.push({
                                            column_id: e,
                                            direction: "descending",
                                        });
                                        break;
                                    case "descending":
                                        j.push({
                                            column_id: e,
                                            direction: "ascending",
                                        });
                                }
                            else
                                j.push({
                                    column_id: e,
                                    direction: "ascending",
                                });
                        var h = n[e],
                            h =
                                "ascending" == j[j.length - 1].direction
                                    ? h.concat()
                                    : h.concat().reverse();
                        g = a(c).find("tr").height();
                        "none" == b.animation
                            ? h.forEach(function (b) {
                                  a(c)
                                      .find("tr.tsort_id-" + b.id)
                                      .css({
                                          top: g,
                                      })
                                      .appendTo(c);
                                  g += b.height;
                              })
                            : "slide" == b.animation
                            ? h.forEach(function (d, f) {
                                  a(c)
                                      .find("tr.tsort_id-" + d.id)
                                      .stop()
                                      .delay(b.delay * f)
                                      .animate(
                                          {
                                              top: g,
                                          },
                                          b.speed,
                                          "swing"
                                      )
                                      .appendTo(c);
                                  g += d.height;
                              })
                            : "fadeAll" == b.animation
                            ? ((k = !0),
                              a(c)
                                  .find("tr:gt(0)")
                                  .fadeOut(b.speed)
                                  .promise()
                                  .done(function () {
                                      h.forEach(function (d, e) {
                                          a(c)
                                              .find("tr.tsort_id-" + d.id)
                                              .css({
                                                  top: g,
                                              })
                                              .appendTo(c);
                                          g += d.height;
                                          e == f.length - 1 &&
                                              a(c)
                                                  .find("tr")
                                                  .delay(1)
                                                  .fadeIn(b.speed, "swing")
                                                  .promise()
                                                  .done(function () {
                                                      k = !1;
                                                  });
                                      });
                                  }))
                            : "fade" == b.animation
                            ? ((k = !0),
                              0 == m.length &&
                                  h.forEach(function (b) {
                                      m[b.id] = a(c)
                                          .find("tr.tsort_id-" + b.id)
                                          .clone();
                                  }),
                              a(c)
                                  .find("tr:gt(0)")
                                  .each(function (d) {
                                      a(this)
                                          .delay(d * b.delay)
                                          .fadeOut(
                                              b.speed,
                                              "swing",
                                              function () {
                                                  a(this).remove();
                                                  a(m[h[d].id])
                                                      .clone()
                                                      .hide()
                                                      .css({
                                                          top: g,
                                                      })
                                                      .appendTo(c)
                                                      .delay(1)
                                                      .fadeIn(
                                                          b.speed,
                                                          "swing",
                                                          function () {
                                                              d ==
                                                                  f.length -
                                                                      1 &&
                                                                  (k = !1);
                                                          }
                                                      );
                                                  g += h[d].height;
                                              }
                                          );
                                  }))
                            : "slideLeftAll" == b.animation
                            ? ((k = !0),
                              a(c)
                                  .find("tr:gt(0)")
                                  .each(function (d) {
                                      a(this)
                                          .delay(d * b.delay)
                                          .animate(
                                              {
                                                  left: "-" + b.distance,
                                                  opacity: 0,
                                              },
                                              b.speed,
                                              "swing"
                                          );
                                      d == f.length - 1 &&
                                          a(this)
                                              .promise()
                                              .done(function () {
                                                  h.forEach(function (d, e) {
                                                      a(c)
                                                          .find(
                                                              "tr.tsort_id-" +
                                                                  d.id
                                                          )
                                                          .css({
                                                              top: g,
                                                              left: "",
                                                              right:
                                                                  "-" +
                                                                  b.distance,
                                                          })
                                                          .appendTo(c)
                                                          .delay(e * b.delay)
                                                          .animate(
                                                              {
                                                                  right: "0px",
                                                                  opacity: 1,
                                                              },
                                                              b.speed,
                                                              "swing",
                                                              function () {
                                                                  a(this).css(
                                                                      "right",
                                                                      "auto"
                                                                  );
                                                                  e ==
                                                                      f.length -
                                                                          1 &&
                                                                      (k = !1);
                                                              }
                                                          );
                                                      g += d.height;
                                                  });
                                              });
                                  }))
                            : "slideLeft" == b.animation &&
                              ((k = !0),
                              0 == m.length &&
                                  h.forEach(function (b) {
                                      m[b.id] = a(c)
                                          .find("tr.tsort_id-" + b.id)
                                          .clone();
                                  }),
                              a(c)
                                  .find("tr:gt(0)")
                                  .each(function (d) {
                                      a(this)
                                          .delay(d * b.delay)
                                          .animate(
                                              {
                                                  left: "-" + b.distance,
                                                  opacity: 0,
                                              },
                                              b.speed,
                                              "swing",
                                              function () {
                                                  a(this).remove();
                                                  a(m[h[d].id])
                                                      .clone()
                                                      .css({
                                                          opacity: 0,
                                                      })
                                                      .appendTo(c)
                                                      .css({
                                                          top: g,
                                                          left: "",
                                                          right:
                                                              "-" + b.distance,
                                                      })
                                                      .animate(
                                                          {
                                                              right: "0px",
                                                              opacity: 1,
                                                          },
                                                          b.speed,
                                                          function () {
                                                              a(this).css(
                                                                  "right",
                                                                  "auto"
                                                              );
                                                              d ==
                                                                  f.length -
                                                                      1 &&
                                                                  (k = !1);
                                                          }
                                                      );
                                                  g += h[d].height;
                                              }
                                          );
                                  }));
                        var p = j[j.length - 1].direction;
                        a(c)
                            .find("tr:first-child th div.sortArrow div")
                            .stop(!0, !0)
                            .fadeOut(b.speed, "swing");
                        switch (p) {
                            case "ascending":
                                a(c)
                                    .find(
                                        "tr:first-child th div.sortArrow div.sortArrowAscending"
                                    )
                                    .eq(e)
                                    .fadeIn(b.speed, "swing");
                                break;
                            case "descending":
                                a(c)
                                    .find(
                                        "tr:first-child th div.sortArrow div.sortArrowDescending"
                                    )
                                    .eq(e)
                                    .fadeIn(b.speed, "swing");
                        }
                    }
                });
        });
    };
})(jQuery);
