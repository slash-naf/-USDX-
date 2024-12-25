using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Text;
using System.Windows.Forms;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

class index{
	[STAThread]
	static void Main(string[] args){
		var e = new NdsCheatEditer();
		string s = e.sb.ToString();
		Clipboard.SetText(s);
		Console.WriteLine("a");
	}
}
public class NdsCheatEditer{
	public void code(){
		//ゲームのメモリ
		Var timerMoving = memory(0x02041D5C, 1);	//動いていれば0
		Var timer = memory(0x02041D60, 4);

		Var music = memory(0x020485C4, 4);
		uint music_reset = 0xFFFFFC19;

		Var situation = memory(0x0205B244, 1);
		uint situation_play = 0;
		uint situation_loadFloor = 1;
		uint situation_pause = 0xB;
		Var gamemode = 		memory(0x0205B245, 1);
		uint gamemode_gco = 3;
		uint gamemode_mw = 5;

		Var stageAndFloor = memory(0x0205B246, 2);

		Var motion = memory(0x0205B248, 4);

		Var setPos = memory(0x0205B24C, 4);

		Var score = memory(0x0205B3C0, 4);
		Var life = 	memory(0x0205B3C4, 1);
		Var metaPt =memory(0x0205B3C5, 1);

		Var isMute = memory(0x0205E76C, 1);
		uint isMute_mute = 0;

		Var takara1 = 	memory(0x0206E100, 4);
		Var takara2 = 	memory(0x0206E104, 4);
		Var gold =		memory(0x0206E108, 4);
		Var takaraCnt =	memory(0x0206E112, 1);
		Var gcoBoss =	memory(0x0206E10E, 1);

		Var arenaCnt = memory(0x0206FC62, 1);

		Var mwCopies =			memory(0x02070A40, 4);
		Var mwSelCopy = 		memory(0x02070A5C, 1);
		Var mwSelCopyUpdateBy1 =memory(0x02070A5E, 1);

		Var getPos = 	memory(0x02076878, 4);
		Var hp1 = 	memory(0x02076A94, 1);
		Var maxHp1 =memory(0x02076A96, 1);
		Var hp2 = 	memory(0x02076CD8, 1);
		Var maxHp2 =memory(0x02076CDA, 1);

		Var displayMode = memory(0x0209ECC4, 4);
		uint displayMode_number = 0;

		Var kirbyCopy = 	memory(0x020BA31B, 1);
		Var wheelieRideBy2 =memory(0x020BA31D, 1);
		Var muteki = 		memory(0x020BA5CC, 2);
		Var helperCopy = 	memory(0x020BAB34, 4);
		Var wheelieRodeBy2 =memory(0x020BAB35, 1);
		Var helperCond = 	memory(0x020BAB38, 2);


		Var menuPageIdx = memory(0x021983CA, 1);


		//自分で使うメモリ
		Var arenaCntSav = memory(1);
		Var stageAndFloorSav = memory(2);
		Var posSav = memory(4);
		Var posInit = memory(4);

		Var kirbyCopySav = memory(1);
		Var helperCopySav = memory(4);
		Var helperCondSav = memory(2);
		Var mutekiSav = memory(2);
		Var mutekiInit = memory(2);

		Var prevSituation = memory(1);

		Var displayTime = memory(4);

		Var musicConfig = memory(1);

		Var mwCopiesSav = memory(4);
		Var mwSelCopySav = memory(1);


		Var checkPoint = memory(4);

		Var motionSav = memory(4);
		Var motionInit = memory(4);


		ifPress(L);
		checkPoint.set(1);	//addCheckPoint
		{
			//ポーズ中にLでセーブ
			situation.cmp(eq, situation_pause);
			{
				arenaCnt.copy(arenaCntSav);
				stageAndFloor.copy(stageAndFloorSav);
				posInit.copy(posSav);
				motionInit.copy(motionSav);

				input.cmp(ne, 0, R);	//Rを押しながらじゃなければ
				{
					kirbyCopy.copy(kirbyCopySav);
					helperCopy.copy(helperCopySav);
					helperCond.copy(helperCondSav);
					mutekiInit.copy(mutekiSav);

					mwCopies.copy(mwCopiesSav);
					mwSelCopy.copy(mwSelCopySav);
				}
			}
			end();
			checkPoint.cmp(eq, 1);	//startFromCheckPoint

			//通常時ににLでロード
			situation.cmp(eq, situation_play);
			checkPoint.set(2);	//addCheckPoint
			{
				//タイマーリセット
				timer.set(0xFFFFFFFF);	//ずれを考慮して

				//残機99
				life.set(99);

				//体力全快
				maxHp1.copy(hp1);
				maxHp2.copy(hp2);

				//ヘルマスでなければ能力面のロード
				Append("A205B244 00FF0900\n");
				{
					kirbyCopySav.copy(kirbyCopy);
					helperCopySav.copy(helperCopy);
					helperCondSav.copy(helperCond);
					mutekiSav.copy(muteki);

					//ウィリーに乗る処理
					helperCondSav.cmp(eq, 0x0201);
					{
						wheelieRideBy2.set(2);
						wheelieRodeBy2.set(2);
					}
				}
				end();
				checkPoint.cmp(eq, 2);	//startFromCheckPoint

				//メタゴーならPt最大
				Append("9205B244 00FF0800\n");
				{
					metaPt.set(50);
				}
				end();
				checkPoint.cmp(eq, 2);	//startFromCheckPoint


				//musicConfigが1なら曲リセット
				musicConfig.cmp(eq, 1);
				{
					music.set(music_reset);
				}
				end();
				//2なら曲ミュート(分かりやすいようにここに書いてるけど常時実行される)
				musicConfig.cmp(eq, 2);
				{
					isMute.set(isMute_mute);
				}
				end();
				checkPoint.cmp(eq, 2);	//startFromCheckPoint


				//格闘王系なら(7～Aでメタゴーでなければ)
				Append("8205B244 00FF0600\n");
				Append("A205B244 00FF0800\n");
				Append("7205B244 00FF0B00\n");
				{
					checkPoint.set(0);	//break的な

					situation.set(5);	//次の戦闘へ
					input.cmp(ne, 0, R);	//Rを押しながらじゃなければ
					{
						situation.set(6);	//再戦
						arenaCntSav.copy(arenaCnt);

						timerMoving.cmp(ne, 0);//タイマーが止まっていれば
						{
							timer.set(0);
						}
					}
				}
				end();
				checkPoint.cmp(eq, 2);	//startFromCheckPoint

				//フロア・座標をロード
				situation.set(situation_loadFloor);
				stageAndFloorSav.copy(stageAndFloor);
				posSav.copy(setPos);
				motionSav.copy(motion);

				gamemode.cmp(eq, gamemode_mw);	//銀河なら
				{
					mwSelCopyUpdateBy1.set(1);
					mwCopiesSav.copy(mwCopies);
					mwSelCopySav.copy(mwSelCopy);
				}
				end();
				checkPoint.cmp(eq, 2);	//startFromCheckPoint

				//洞窟なら宝とボスをリセット
				gamemode.cmp(eq, gamemode_gco);
				{
					Append("0206E100 00000000\n");
					Append("0206E104 00000000\n");
					Append("2206E112 00000000\n");
					Append("2206E10E 00000000\n");
				}
				end();
			}
		}
		checkPoint.set(0);	//checkPointの初期化





		//ポーズ中に上入力で曲の設定
		situation.cmp(eq, situation_pause);
		ifPress(Up);
		{
			menuPageIdx.copy(musicConfig);
		}
		end();





		//フロア遷移時の座標を保存
		posInit.cmp(eq, 0);
		{
			getPos.copy(posInit);
			motion.copy(motionInit);
		}
		end();
		getPos.cmp(eq, 0);
		{
			posInit.set(0);
		}
		end();

		//前回の場面が通常で、現在の場面が通常でもポーズでもなければ（つまりフロア遷移時なら・ロード中などに入った最初のフレームなら）
		situation.cmp(ne, situation_play);
		situation.cmp(ne, situation_pause);
		prevSituation.cmp(eq, situation_play);
		{
			muteki.copy(mutekiInit);	//フロア遷移時の無敵時間を保存
			timer.copy(displayTime);	//表示タイムを更新
		}
		end();

		//タイマーが表示されるゲームモードなら
		gamemode.cmp(lt, 7);
		{
			displayMode.set(displayMode_number);	//ボス戦でもスコア・ゴールドが常に表示されるようにする
			displayTime.copy(score);	//スコアに表示

			//洞窟ならゴールドに表示
			gamemode.cmp(eq, gamemode_gco);
			{
				displayTime.copy(gold);
			}
		}
		end();

		//R+startで、本来ポーズできない所でもポーズ
		input.cmp(eq, 0, R);
		ifPress(START);
		{
			situation.set(situation_pause);
		}
		end();


		situation.copy(prevSituation);


	}

	public NdsCheatEditer(){
		input = memory(0x04000130, 2);
		prevInput = memory(2);

		code();

		input.copy(prevInput);
	}

	public Var input;
	public Var prevInput;
	public void ifPress(uint n){
		input.cmp(eq, 0, n);
		prevInput.cmp(ne, 0, n);
	}

	public StringBuilder sb = new StringBuilder();

	const uint lt = 3;
	const uint gt = 4;
	const uint eq = 5;
	const uint ne = 6;

	const uint A		= 0x3FE;
	const uint B		= 0x3FD;
	const uint SELECT= 0x3FB;
	const uint START = 0x3F7;
	const uint Right = 0x3EF;
	const uint Left	= 0x3DF;
	const uint Up	= 0x3BF;
	const uint Down	= 0x37F;
	const uint R		= 0x2FF;
	const uint L		= 0x1FF;

	public uint offset = 0;
	public void initializeOffset(){
		if(offset != 0){
			this.offset = 0;
			this.Append("D3000000 00000000\n");
		}
	}
	public void end(){
		this.offset = 0;
		this.Append("D2000000 00000000\n");
	}


	public Var memory(uint addr, uint len){
		return new Var(addr, len, this);
	}
	public uint[] memoryCnts = new uint[]{0,0,0,0,0};
	public Var memory(uint len){
		uint addr = memoryCnts[len];
		memoryCnts[len] += len;
		return new Var(addr, len, this);
	}




	public void Append(string s){
		sb.Append(s);
	}
}
public class Var{
	NdsCheatEditer p;
	uint addr;
	uint len;
	public Var(uint addr, uint len, NdsCheatEditer p){
		this.p = p;
		this.addr = addr;
		this.len = len;
	}

	public void calcAddr(){
		if(this.addr < 0x400){
			switch(this.len){
			case 1:
				this.addr += 0x023FE000 + p.memoryCnts[4] + p.memoryCnts[2];
				break;
			case 2:
				this.addr += 0x023FE000 + p.memoryCnts[4];
				break;
			case 4:
				this.addr += 0x023FE000;
				break;
			}
		}
	}

	public void set(uint n){
		calcAddr();
		p.initializeOffset();
		switch(this.len){
		case 1:
			p.Append($"2{this.addr:X7} {n:X8}\n");
			break;
		case 2:
			p.Append($"1{this.addr:X7} {n:X8}\n");
			break;
		case 4:
			p.Append($"0{this.addr:X7} {n:X8}\n");
			break;
		}
	}
	public void copy(Var x){
		calcAddr();
		x.calcAddr();
		if(p.offset != this.addr){
			p.offset = this.addr;
			p.Append($"D3000000 {this.addr:X8}\n");
		}
		p.Append($"F{x.addr:X7} {this.len:X8}\n");
	}
	public void cmp(uint ins, uint n, uint mask = 0){
		calcAddr();
		//p.initializeOffset();
		if(this.len <= 2){ins += 4;}
		switch(this.len){
		case 1:
			if(0 == this.addr % 2){
				p.Append($"{ins:X1}{this.addr:X7} FF{mask:X2}00{n:X2}\n");
			}else{
				p.Append($"{ins:X1}{(this.addr-1):X7} {mask:X2}FF{n:X2}00\n");
			}
			break;
		case 2:
			p.Append($"{ins:X1}{this.addr:X7} {mask:X4}{n:X4}\n");
			break;
		case 4:
			p.Append($"{ins:X1}{this.addr:X7} {n:X8}\n");
			break;
		}
	}
}