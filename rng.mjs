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
				dashOrWalkIdx: (ofs + 555 + n) & 0xFFF,
				postDashIdx: (ofs + 584) & 0xFFF,
				postWalkIdx: (ofs + 598 + n) & 0xFFF,
				cnt: cnt
			});
			rslt.cntSum += cnt;
		}

		return rslt;
	},
	calc(candidates){
		let rslt = {
			dashAndJumpCnt: 0,
			walkAndJumpCnt: 0,
			jumpCnt: 0,
			preFightAdvance: 0,
			postDashAdvance: 0,
			postWalkAdvance: 0,
		};

		const postDashOrWalkAdvanceMax = Math.max(this.postDashAdvanceMax, this.postWalkAdvanceMax);

		for(let advance1=0; advance1 <= this.preFightAdvanceMax; advance1++){

			let dashAndJumpCnt = 0;
			let postDashAdvance = 0;
			let walkAndJumpCnt = 0;
			let postWalkAdvance = 0;

			//飛ぶかの判定までに進める乱数の最適な量を探す
			for(let advance2=0; advance2 <= postDashOrWalkAdvanceMax; advance2++){
				let _dashAndJumpCnt = 0;
				let _walkAndJumpCnt = 0;
				for(let x of candidates){
					//走るなら
					if(0 < randiAt(x.dashOrWalkIdx + advance1, 4)){
						//飛ぶなら
						if(advance2 <= this.postDashAdvanceMax && 0 == randiAt(x.postDashIdx + advance1 + advance2, 4)){
							_dashAndJumpCnt += x.cnt;
						}
					//歩くなら
					}else{
						//飛ぶなら
						if(advance2 <= this.postWalkAdvanceMax && 0 == randiAt(x.postWalkIdx + advance1 + advance2, 4)){
							_walkAndJumpCnt += x.cnt;
						}
					}
				}

				//より高確率なら更新
				if(_dashAndJumpCnt > dashAndJumpCnt){
					dashAndJumpCnt = _dashAndJumpCnt;
					postDashAdvance = advance2;
				}
				if(_walkAndJumpCnt > walkAndJumpCnt){
					walkAndJumpCnt = _walkAndJumpCnt;
					postWalkAdvance = advance2;
				}
			}

			//飛ぶ確率、走る確率、走った場合の進める量の少なさの順の条件で更新
			const jumpCnt = dashAndJumpCnt + walkAndJumpCnt;
			if(
				jumpCnt > rslt.jumpCnt || 
				(jumpCnt >= rslt.jumpCnt && dashAndJumpCnt > rslt.dashAndJumpCnt) || 
				(jumpCnt >= rslt.jumpCnt && dashAndJumpCnt >= rslt.dashAndJumpCnt && postDashAdvance < rslt.postDashAdvance)
			){
				rslt.dashAndJumpCnt = dashAndJumpCnt;
				rslt.walkAndJumpCnt = walkAndJumpCnt;
				rslt.jumpCnt = jumpCnt;
				rslt.preFightAdvance = advance1;
				rslt.postDashAdvance = postDashAdvance;
				rslt.postWalkAdvance = postWalkAdvance;
			}
		}

		return rslt;
	}
}

export {Star, Corkboard, HeavyLobster, rngAt, randi, randiAt};