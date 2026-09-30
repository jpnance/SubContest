import pymupdf
import requests
import copy
from datetime import datetime
import re
import json

INIT_DATE = {2026: datetime(2026,9,9,17)}
SEASON = 2026
URL_FMT = 'https://www.westgateresorts.com/supercontest/download/2026%20SUPERCONTEST%20GAME%20SHEET%20WEEK%20{}.pdf?contest=/2026/SuperContest/Card'

CARD_URL = 'https://www.westgateresorts.com/hotels/nevada/las-vegas/westgate-las-vegas-resort-casino/casino/2026-supercontest-card/'
CARD_URL_FMT = 'https://www.westgateresorts.com{}'

REGEX = re.compile('\d+\s(.*?)(\*?\s?\*?)$')
R = re.compile('^\+?\d\d?(\.5)?$')
P = re.compile('^PK$')

WEEK = lambda date: max([min([(date - INIT_DATE[SEASON]).days // 7, 17]), 0]) + 1

def get_card_url(week):
    from bs4 import BeautifulSoup as bs

    b = bs(requests.get(CARD_URL).content, features='lxml')
    download_links = [l['href'] for l in b.find_all('a') if re.search('.*?(Download\n).*?', l.text) and re.search('\D{}\.'.format(week), l['href'])]

    return CARD_URL_FMT.format(download_links[0])

def process(team):
    if team == 'BUCCANERS':
        return 'BUCCANEERS'
    elif team == 'BELGALS':
        return 'BENGALS'
    elif team == 'COMANDERS':
        return 'COMMANDERS'
    else:
        return team

def parse_card(response, week, url = ''):
    doc = pymupdf.Document(stream=response.content)
    page = doc.load_page(0)
    pdf_data = page.get_text().split('\n')

    outstruct_init = {'teams': [], 'line': ''}
    outstruct = copy.deepcopy(outstruct_init)
    output = []
    for i,line in enumerate(pdf_data):
        try:
            outstruct['teams'].append(process(REGEX.match(line)[1]))
        except Exception as e:
            try:
                if spread := R.match(line):
                    outstruct['line'] = spread[0]
                    output.append(copy.deepcopy(outstruct))
                    outstruct = copy.deepcopy(outstruct_init)
                elif spread := P.match(line):
                    outstruct['line'] = spread[0]
                    output.append(copy.deepcopy(outstruct))
                    outstruct = copy.deepcopy(outstruct_init)
            except Exception as e:
                print(e)

    for game in output:
        game['favorite'] = game['teams'][0]
        game['underdog'] = game['teams'][1]
        del game['teams']

    print(json.dumps({'data': output, 'week': WEEK(datetime.now()), 'season': SEASON, 'url': url}, indent=2))

def main():
    week = WEEK(datetime.now())

    pdf_url = URL_FMT.format(week)
    response = requests.get(pdf_url)

    if response.status_code == 200:
        parse_card(response, week)
    else:
        url = get_card_url(week)
        response = requests.get(url)
        if response.status_code == 200:
            parse_card(response, week, url)

if __name__ == '__main__':
    main()