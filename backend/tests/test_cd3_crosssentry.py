import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.cd3_crosssentry.m2_fusion import CRS, bel_pl, dempster_combine, mass
from app.modules.cd3_crosssentry.m3_response import gini, level_for, lorenz
from app.modules.cd3_crosssentry.service import Cd3Session

client = TestClient(app)


def test_dempster_hand_example():
    m1 = {"N": 0.6, "A": 0.3, "T": 0.1}
    m2 = {"N": 0.2, "A": 0.7, "T": 0.1}
    m, k = dempster_combine(m1, m2)
    # K = 0.6·0.7 + 0.3·0.2 = 0.48
    assert k == pytest.approx(0.48)
    assert m["N"] == pytest.approx((0.12 + 0.06 + 0.02) / 0.52)
    assert m["A"] == pytest.approx((0.21 + 0.03 + 0.07) / 0.52)
    assert m["T"] == pytest.approx(0.01 / 0.52)
    bel, pl = bel_pl(m)
    assert bel == pytest.approx(m["A"]) and pl == pytest.approx(m["A"] + m["T"])
    assert sum(m.values()) == pytest.approx(1.0)
    assert mass(0.7, 0.5)["T"] == 0.0  # chuẩn hóa khi tổng > 1


def test_crs_decay_and_jump():
    c = CRS()
    k = ("V7", "A→B")
    c.update(k, 0.1)
    low = c.r[k]
    c.update(k, 0.95)  # bằng chứng bất thường mạnh → bước nhảy
    assert c.r[k] > low + 0.3
    hi = c.r[k]
    for _ in range(5):
        c.update(k, 0.0)  # trở lại bình thường → suy giảm
    assert c.r[k] < hi * 0.6
    c.update(k, None)
    assert c.r[k] < hi


def test_gini_and_levels():
    assert gini([1, 1, 1, 1]) == pytest.approx(0.0)
    assert gini([0, 0, 0, 5]) == pytest.approx(3 / 4)
    assert lorenz([1, 1])[-1]["l"] == 1.0
    assert level_for(0.1) == "R0" and level_for(0.5) == "R2" and level_for(0.9) == "R4"


@pytest.mark.parametrize(
    "scenario,group,rule",
    [
        ("collusion", {"V4", "V5", "V6", "R3"}, "mint_without_lock"),
        ("replay", {"R3"}, "double_process"),
        ("slow_burn", {"V7"}, "value_out_gt_in"),
        ("boosting", {"U5", "U6"}, "circular_small"),
    ],
)
def test_scenarios_raise_alerts_on_right_group(scenario, group, rule):
    s = Cd3Session()
    for _ in range(3):
        s.tick()
    s.start(scenario)
    for _ in range(6):
        s.tick()
    assert any(rule in e["rules"] for e in s.evidence)
    top = s.series(3)[0]["actor"]
    assert top in group, (scenario, top)
    pending = [q for q in s.queue if q["status"] == "pending"]
    assert any(q["target"] in group for q in pending)
    # R4/R5 không tự thi hành khi chưa phê duyệt
    assert s.executed == {}
    assert not any(bool(s.b.call(s.gateway, "blocked", s.traffic.actors[a].address)) for a in group)


def test_delayed_flags_relayer_latency():
    s = Cd3Session()
    s.start("delayed")
    for _ in range(9):
        s.tick()
    assert any("latency" in e["rules"] and ["R2", 1.0] in e["attributed"] for e in s.evidence)


def test_approve_blocks_actor_onchain_via_api():
    client.post("/api/cd3/reset")
    client.post("/api/cd3/tick?n=3")
    client.post("/api/cd3/start?scenario=collusion")
    st = None
    for _ in range(4):
        st = client.post("/api/cd3/tick?n=1").json()["state"]
    q = next(q for q in st["queue"] if q["status"] == "pending" and q["level"] == "R5")
    r = client.post(f"/api/cd3/approve/{q['id']}").json()
    assert r["txs"][0]["fn"] == "pause()" and r["txs"][0]["status"] == 1
    st = client.post("/api/cd3/tick?n=1").json()
    mints = [t for t in st["txs"] if t["chain"] == "chain-B" and t["fn"].startswith("mint")]
    assert mints and all(t["status"] == 0 and "paused" in t["reason"] for t in mints)
    assert client.post(f"/api/cd3/approve/{q['id']}").status_code == 400  # đã quyết định
    g = client.get("/api/cd3/gsurv").json()
    assert 0 <= g["gini"] <= 1
    t = client.post("/api/cd3/tune", json={"w_d": 1, "w_g": 0.5, "w_c": 0.3}).json()
    assert t["best"]["theta"] > 0 and len(t["curve"]) == 12
