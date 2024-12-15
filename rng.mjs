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
					add(ofs-1 & 0xFFF, 2);
					add(ofs | 0x2000, 2);
					add(ofs, 1);
				}
			}
		}

		let rslt = [];
		for(const [ofs, cnt] of map.entries()){
			let n = ofs >> 12;
			rslt.push({
				dash_or_walk: (ofs + 555 + n) & 0xFFF,
				after_dash: (ofs + 584) & 0xFFF,
				after_walk: (ofs + 598 + n) & 0xFFF,
				cnt: cnt
			});
		}

		return rslt;
	},
	calc(candidates){
		let bestCnt = 0;
		let bestStep = 0;
		let bestStep2 = 0;
		for(let step2=0; step2 <= 7; step2++){
			for(let step=0; step < 40; step++){
				let cnt = 0;
				for(let x of candidates){
					if(
						randiAt(x.after_dash + step + step2, 4) == 0 && 
						randiAt(x.dash_or_walk + step, 4) != 0
					){
						cnt += x.cnt
					}
				}
				if(cnt > bestCnt){
					bestCnt = cnt;
					bestStep = step;
					bestStep2 = step2;
				}
			}
		}

		candidates = candidates.filter(x => randiAt(x.dash_or_walk + bestStep) == 0);
		let bestCnt2 = 0;
		let bestStep3 = 0; //歩いた場合に進める数
		for(let step3=0; step3 <= 7; step3++){
			let cnt = 0;
			for(let x of candidates){
				if(
					randiAt(x.after_walk + bestStep + step3, 4) == 0
				){
					cnt += x.cnt
				}
			}
			if(cnt > bestCnt2){
				bestCnt2 = cnt;
				bestStep3 = step3;
			}
		}

		return {
			dash_or_walk: bestStep,
			after_dash: bestStep2,
			after_walk: bestStep3,
			dash_and_jump: bestCnt,
			walk_and_jump: bestCnt2,
		};
	}
}

export {Corkboard, HeavyLobster, Star, rngAt, randiAt};