//乱数サイクルを作成
const rngCycle = Array.from(function*(){
	let x = 0;
	do{
		yield x;
		x = (x * 61 + 1401) & 0xFFF;	//乱数更新式
	}while(x !== 0);
}());

//指定した位置の乱数取得
const rngAt = i => rngCycle[i & 0xFFF];

//乱数値から任意の範囲の乱数を生成
const randi = (seed, max) => seed * max >> 12;
const randiAt = (i, max) => rngCycle[i & 0xFFF] * max >> 12;

//星の向きの乱数
const Star = {
	names: ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'],
	at: i => randiAt(i, 9) % 8,
}

//コルクボードの曲から乱数を予測
const Corkboard = {
	names: ['裏コルクボード', 'コルクボード'],
	at: i => randiAt(i, 2),
	search(pattern){
		let rslt = [];
		for(let ofs=0; ofs < 0x1000; ofs ++){
			if(pattern.every((x, i)=> 0 > x || this.at(ofs + i * 2) == x)){
				rslt.push(ofs);
			}
		}
		return rslt;
	}
}

//ヘビーロブスター戦で星の向きから乱数を予測し、乱数をいくつ手動で進めれば目的の乱数を引けるか計算
const HeavyLobster = {
	preFightAdvanceMax: 31,
	postDashAdvanceMax: 7,
	postWalkAdvanceMax: 11,
	//星の向きから乱数を推測
	search(pattern){
		let ofs = 0;

		let map = new Map();
		const add = (i, n)=>{
			let d = map.get(i);
			map.set(i, (d ?? 0) + n);
		}

		const match = (i, n)=> pattern[i] < 0 || pattern[i] == Star.at(ofs + n);

		for(; ofs < 0x1000; ofs++){
			if(match(0,0) && match(3, 160)){
				let b = match(1, 66);
				if(match(2, 127) && match(4, 179)){
					if(match(1, 64)){
						add(ofs, 1);
					}
					if(b){
						add(ofs, 2);
					}
				}
				if(b && match(2, 129) && match(4, 181)){
					add(ofs+2 & 0xFFF, 2);
					add(ofs | 0x2000, 2);
					add(ofs, 1);
				}
			}
		}

		let rslt = [];
		rslt.cntSum = 0;
		for(const [ofs, cnt] of map.entries()){
			let n = ofs >> 12;
			rslt.push({
				dashWalkIdx: (ofs + 555 + n) & 0xFFF,
				postDashIdx: (ofs + 584) & 0xFFF,
				postWalkIdx: (ofs + 598 + n) & 0xFFF,
				cnt: cnt
			});
			rslt.cntSum += cnt;
		}

		return rslt;
	},
	//乱数を進める最適な量を計算
	calc(candidates){
		//飛ぶかの判定までにさらに進める乱数の最適な量を探す
		const maxJumpCntFromPreFightAdvance = preFightAdvance =>{
			let rslt = {
				dashJumpCnt: 0,
				postDashAdvance: 0,
				walkJumpCnt: 0,
				postWalkAdvance: 0,
			};
			for(let i=0, leDash, leWalk; (leDash = i <= this.postDashAdvanceMax) | (leWalk = i <= this.postWalkAdvanceMax); i++){
				//走った場合と歩いた場合のジャンプする確率を調べる
				let dashJumpCnt = 0;
				let walkJumpCnt = 0;
				for(let x of candidates){
					if(0 < randiAt(x.dashWalkIdx + preFightAdvance, 4)){	//走るなら
						if(leDash && 0 == randiAt(x.postDashIdx + preFightAdvance + i, 4)){
							dashJumpCnt += x.cnt;
						}
					}else{	//歩くなら
						if(leWalk && 0 == randiAt(x.postWalkIdx + preFightAdvance + i, 4)){
							walkJumpCnt += x.cnt;
						}
					}
				}
				//より高確率なら更新
				if(dashJumpCnt > rslt.dashJumpCnt){
					rslt.dashJumpCnt = dashJumpCnt;
					rslt.postDashAdvance = i;
				}
				if(walkJumpCnt > rslt.walkJumpCnt){
					rslt.walkJumpCnt = walkJumpCnt;
					rslt.postWalkAdvance = i;
				}
			}
			return rslt;
		}

		//乱数を進める最適な量を探す
		let rslt = {
			cnt: candidates.cntSum,

			dashJumpCnt: 0,
			postDashAdvance: 0,
			walkJumpCnt: 0,
			postWalkAdvance: 0,

			preFightAdvance: 0,
			jumpCnt: 0,
			dashCnt: 0,
			dashGlideCnt: 0,

			walkCnt: 0,
			walkGlideCnt: 0,
			glideCnt: 0,
		};
		for(let preFightAdvance=0; preFightAdvance <= this.preFightAdvanceMax; preFightAdvance++){
			let t = maxJumpCntFromPreFightAdvance(preFightAdvance);

			//飛ぶ確率、走って飛ぶ確率、走ったら進める量の少なさ、歩いたら進める量の少なさ、走って滑走する確率の順の条件で更新
			let jumpCnt = t.dashJumpCnt + t.walkJumpCnt;
			let dashCnt = candidates.reduce((prev, x)=> 0 < randiAt(x.dashWalkIdx + preFightAdvance, 4) ? prev + x.cnt : prev, 0);
			let dashGlideCnt = dashCnt - t.dashJumpCnt;
			if( 0 < (
				jumpCnt - rslt.jumpCnt ||
				t.dashJumpCnt - rslt.dashJumpCnt ||
				rslt.postDashAdvance - t.postDashAdvance ||
				rslt.postWalkAdvance - t.postWalkAdvance ||
				dashGlideCnt - rslt.dashGlideCnt
			)){
				rslt.preFightAdvance = preFightAdvance;
				rslt.jumpCnt = jumpCnt;
				rslt.dashCnt = dashCnt;
				rslt.dashGlideCnt = dashGlideCnt;

				rslt.dashJumpCnt = t.dashJumpCnt;
				rslt.postDashAdvance = t.postDashAdvance;
				rslt.walkJumpCnt = t.walkJumpCnt;
				rslt.postWalkAdvance = t.postWalkAdvance;
			}
		}

		//他の確率
		rslt.walkCnt = rslt.cnt - rslt.dashCnt;
		rslt.walkGlideCnt = rslt.walkCnt - rslt.walkJumpCnt;
		rslt.glideCnt = rslt.cnt - rslt.jumpCnt;

		return rslt;
	}
}

export {Star, Corkboard, HeavyLobster, rngAt, randi, randiAt};