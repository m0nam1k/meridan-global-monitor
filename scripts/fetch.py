#!/usr/bin/env python3
"""Fetch public natural-hazard data; retain last good records on source outages."""
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'alerts.json'
NOW = datetime.now(timezone.utc).isoformat()
SOURCES = {
    'usgs': 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
    'nasa': 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=500&days=30',
}

def download(url):
    req = urllib.request.Request(url, headers={'User-Agent':'GlobalAlertsDashboard/1.0 (open source)', 'Accept':'application/json'})
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response)

def usgs_alerts(raw):
    result=[]
    for f in raw.get('features', []):
        p=f.get('properties') or {}; geo=f.get('geometry') or {}; c=geo.get('coordinates') or []
        if len(c)<2 or not isinstance(c[0],(int,float)) or not isinstance(c[1],(int,float)):continue
        m=p.get('mag'); m=float(m) if isinstance(m,(int,float)) else 0
        result.append({'id':'usgs:'+str(f.get('id')),'title':p.get('title') or 'Earthquake','category':'Earthquake','severity':'critical' if m>=6 else 'high' if m>=5 else 'moderate' if m>=4 else 'low','lat':c[1],'lon':c[0],'time':datetime.fromtimestamp(p['time']/1000,timezone.utc).isoformat() if p.get('time') else NOW,'source':'USGS','url':p.get('url') or 'https://earthquake.usgs.gov/','details':f'Magnitude {m:.1f} · Depth {c[2]:.1f} km' if len(c)>2 and isinstance(c[2],(int,float)) else f'Magnitude {m:.1f}'})
    return result

def nasa_alerts(raw):
    result=[]
    for e in raw.get('events',[]):
        geo=e.get('geometry') or []
        if not geo:continue
        newest=max(geo,key=lambda g:g.get('date') or '')
        geom=newest.get('coordinates'); kind=newest.get('type')
        if kind=='Point' and isinstance(geom,list) and len(geom)>=2:
            lon,lat=geom[:2]
        elif kind=='Polygon' and geom and geom[0] and geom[0][0]:
            lon,lat=geom[0][0][:2]
        else:continue
        if not all(isinstance(x,(float,int)) for x in (lon,lat)):continue
        cat=', '.join(x.get('title','') for x in e.get('categories',[])) or 'Natural event'
        result.append({'id':'nasa:'+str(e.get('id')),'title':e.get('title') or cat,'category':cat,'severity':'unrated','lat':lat,'lon':lon,'time':newest.get('date') or NOW,'source':'NASA EONET','url':e.get('link') or 'https://eonet.gsfc.nasa.gov/','details':e.get('description') or 'Active natural event. Severity not provided by NASA EONET.'})
    return result

def main():
    existing={}
    if OUT.exists():
        try:existing=json.loads(OUT.read_text())
        except (ValueError,OSError):pass
    statuses={}; items=[]; succeeded=0
    for key,parser in [('usgs',usgs_alerts),('nasa',nasa_alerts)]:
        try:
            events=parser(download(SOURCES[key])); succeeded+=1
            statuses[key]={'ok':True,'updated':NOW,'count':len(events)}
        except Exception as exc:
            events=[x for x in existing.get('alerts',[]) if x.get('source')==('USGS' if key=='usgs' else 'NASA EONET')]
            old=existing.get('sources',{}).get(key,{})
            statuses[key]={'ok':False,'updated':old.get('updated'),'count':len(events),'error':str(exc)[:180]}
        items.extend(events)
    if not succeeded and not existing.get('alerts'):
        raise RuntimeError('Both feeds unavailable; no existing data to preserve')
    items.sort(key=lambda x:x.get('time',''),reverse=True)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    tmp=OUT.with_suffix('.tmp')
    tmp.write_text(json.dumps({'generatedAt':NOW,'sources':statuses,'alerts':items},ensure_ascii=False,separators=(',',':'))+'\n')
    os.replace(tmp,OUT)
    print(f'Collected {len(items)} alerts ({succeeded}/2 sources healthy)')

if __name__=='__main__':main()
