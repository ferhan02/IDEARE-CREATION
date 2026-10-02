<?php
declare(strict_types=1);
function b64url_encode(string $data): string { return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); }
function b64url_decode(string $data): string { $data=strtr($data,'-_','+/'); $pad=strlen($data)%4; if($pad)$data.=str_repeat('=',4-$pad); $d=base64_decode($data,true); if($d===false)throw new RuntimeException('Invalid base64url.'); return $d; }
function webauthn_host(): string { return strtolower(preg_replace('/:\\d+$/','',$_SERVER['HTTP_HOST']??'localhost')); }
function webauthn_rp_id(): string { return webauthn_host(); }
function webauthn_origin(): string { $https=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off'; return ($https?'https':'http').'://'.($_SERVER['HTTP_HOST']??'localhost'); }
function webauthn_random_challenge(): string { return b64url_encode(random_bytes(32)); }
function cbor_decode_at(string $data,int $offset=0): array {
 if($offset>=strlen($data)) throw new RuntimeException('Unexpected end of CBOR.');
 $initial=ord($data[$offset++]);$major=$initial>>5;$ai=$initial&31;
 $readLen=function(int $ai)use($data,&$offset):int{ if($ai<24)return $ai; if($ai===24)return ord($data[$offset++]); if($ai===25){$v=unpack('n',substr($data,$offset,2))[1];$offset+=2;return $v;} if($ai===26){$v=unpack('N',substr($data,$offset,4))[1];$offset+=4;return $v;} if($ai===27){$p=unpack('N2',substr($data,$offset,8));$offset+=8;return (int)($p[1]*4294967296+$p[2]);} throw new RuntimeException('Unsupported CBOR length.');};
 if($major===0)return[$readLen($ai),$offset]; if($major===1)return[-1-$readLen($ai),$offset];
 if($major===2||$major===3){$len=$readLen($ai);$v=substr($data,$offset,$len);$offset+=$len;return[$v,$offset];}
 if($major===4){$len=$readLen($ai);$arr=[];for($i=0;$i<$len;$i++){[$v,$offset]=cbor_decode_at($data,$offset);$arr[]=$v;}return[$arr,$offset];}
 if($major===5){$len=$readLen($ai);$map=[];for($i=0;$i<$len;$i++){[$k,$offset]=cbor_decode_at($data,$offset);[$v,$offset]=cbor_decode_at($data,$offset);$map[$k]=$v;}return[$map,$offset];}
 if($major===7){if($ai===20)return[false,$offset];if($ai===21)return[true,$offset];if($ai===22)return[null,$offset];}
 throw new RuntimeException('Unsupported CBOR type.');
}
function pem_wrap(string $der): string { return "-----BEGIN PUBLIC KEY-----\n".chunk_split(base64_encode($der),64,"\n")."-----END PUBLIC KEY-----\n"; }
function cose_key_to_pem(array $cose): string {
 $kty=$cose[1]??null;$alg=$cose[3]??null;
 if($kty===2&&$alg===-7){$crv=$cose[-1]??null;$x=$cose[-2]??null;$y=$cose[-3]??null;if($crv!==1||!is_string($x)||!is_string($y)||strlen($x)!==32||strlen($y)!==32)throw new RuntimeException('Unsupported EC key.');$prefix=hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200');return pem_wrap($prefix."\x04".$x.$y);} throw new RuntimeException('Only ES256 passkeys are supported by this prototype.');
}
function verify_client_data(string $json,string $type,string $challenge): void { $c=json_decode($json,true); if(!is_array($c))throw new RuntimeException('Invalid client data.'); if(($c['type']??'')!==$type)throw new RuntimeException('Unexpected WebAuthn type.'); if(!hash_equals($challenge,$c['challenge']??''))throw new RuntimeException('Challenge mismatch.'); if(($c['origin']??'')!==webauthn_origin())throw new RuntimeException('Origin mismatch.'); }
function verify_rp_hash(string $authData): void { if(strlen($authData)<37)throw new RuntimeException('Authenticator data too short.'); if(!hash_equals(hash('sha256',webauthn_rp_id(),true),substr($authData,0,32)))throw new RuntimeException('RP ID mismatch.'); }
function parse_registration_auth_data(string $authData): array { verify_rp_hash($authData);$flags=ord($authData[32]);if(($flags&1)===0)throw new RuntimeException('User presence missing.');if(($flags&64)===0)throw new RuntimeException('Attested credential missing.');$count=unpack('N',substr($authData,33,4))[1];$o=37+16;$len=unpack('n',substr($authData,$o,2))[1];$o+=2;$cred=substr($authData,$o,$len);$o+=$len;[$cose,$n]=cbor_decode_at($authData,$o);if(!is_array($cose))throw new RuntimeException('Invalid public key.');return['credential_id'=>$cred,'sign_count'=>$count,'cose'=>$cose]; }
function verify_authentication_signature(string $authData,string $clientData,string $sig,string $pem): int { verify_rp_hash($authData);$flags=ord($authData[32]);if(($flags&1)===0)throw new RuntimeException('User presence missing.');$signed=$authData.hash('sha256',$clientData,true);if(openssl_verify($signed,$sig,$pem,OPENSSL_ALGO_SHA256)!==1)throw new RuntimeException('Passkey signature invalid.');return unpack('N',substr($authData,33,4))[1]; }
