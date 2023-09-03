#!/QOpenSys/pkgs/bin/python
import json, csv, sys

with open(sys.argv[1] + '.json', 'r') as in_f:
    jsonl_data = [json.loads(line) for line in in_f.readlines()]

with open(sys.argv[1] + '.csv', 'w', encoding="utf_8_sig") as out_f:
    writer = csv.DictWriter(out_f, fieldnames=jsonl_data[0].keys(), 
                            doublequote=True, quoting=csv.QUOTE_NONNUMERIC)
    writer.writeheader()
    for item in jsonl_data:
        writer.writerow(item)