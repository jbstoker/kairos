# The 24 solar terms (jieqi) with approximate Gregorian dates (month, day).
TERMS = [
    ("立春 Lichun", 2, 4), ("雨水 Yushui", 2, 19),
    ("惊蛰 Jingzhe", 3, 6), ("春分 Chunfen", 3, 21),
    ("清明 Qingming", 4, 5), ("谷雨 Guyu", 4, 20),
    ("立夏 Lixia", 5, 6), ("小满 Xiaoman", 5, 21),
    ("芒种 Mangzhong", 6, 6), ("夏至 Xiazhi", 6, 21),
    ("小暑 Xiaoshu", 7, 7), ("大暑 Dashu", 7, 23),
    ("立秋 Liqiu", 8, 8), ("处暑 Chushu", 8, 23),
    ("白露 Bailu", 9, 8), ("秋分 Qiufen", 9, 23),
    ("寒露 Hanlu", 10, 8), ("霜降 Shuangjiang", 10, 23),
    ("立冬 Lidong", 11, 7), ("小雪 Xiaoxue", 11, 22),
    ("大雪 Daxue", 12, 7), ("冬至 Dongzhi", 12, 22),
    ("小寒 Xiaohan", 1, 6), ("大寒 Dahan", 1, 20),
]


def term_index(month, day):
    """Return the index of the current solar term for a Gregorian date.

    The solar-term cycle starts at Lichun (~Feb 4). Dates before Lichun
    (Jan 1 - Feb 3) belong to the previous cycle's closing terms
    (Xiaohan / Dahan), so the date is shifted forward by a year for
    comparison.
    """
    if (month, day) < (2, 4):
        month += 12
    current = 0
    for i, (_, m, d) in enumerate(TERMS):
        # January terms (Xiaohan, Dahan) close the cycle: shift them too.
        compared_month = m + 12 if m <= 1 else m
        if (month, day) >= (compared_month, d):
            current = i
    return current


def term_for_date(month, day):
    return TERMS[term_index(month, day)][0]
